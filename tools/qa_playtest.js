#!/usr/bin/env node
// tools/qa_playtest.js -- headless random-play QA for a compiled Dendry (dendrynexus) game.
//
// Why this exists: the Dendry engine CATCHES exceptions thrown by scene code and only
// console.logs them, so a broken {! ... !} block silently stops half-way in the browser.
// This tool plays the game with random choices (including the card/hand system) and
// REPORTS those swallowed errors, plus stack overflows, NaN/Infinity quality values,
// "undefined"/"NaN" leaking into prose, dead ends, and scene coverage.
//
// usage:
//   npx dendrynexus compile            # produces out/game.json
//   node tools/qa_playtest.js [--game out/game.json] [--seeds 8] [--steps 12000]
//        [--vars year,month,chancellor_party,...] [--scenes "^z_|papen|kahr"] [--verbose]
// exit code: 0 = clean, 1 = problems found.
'use strict';
const path = require('path');
const fs = require('fs');

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const v = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
    args[k] = v;
  }
}
const GAME = args.game || 'out/game.json';
const SEEDS = parseInt(args.seeds || '8', 10);
const MAX_STEPS = parseInt(args.steps || '12000', 10);
const WATCH = (args.vars || 'year,month,chancellor_party,president').split(',');
const SCENE_RE = args.scenes ? new RegExp(args.scenes) : null;
const DN = args.dn || path.join(process.cwd(), 'node_modules', 'dendrynexus');
const engine = require(path.join(DN, 'lib/engine'));
const utils = require(path.join(DN, 'lib/cli/utils'));

// Errors that are artifacts of running outside a browser. Real browser-only code paths
// (DOM, d3, localStorage) cannot be tested headlessly -- review those by reading.
const NOISE = /localStorage|querySelector|appendChild|getElementById|Image is not defined|d3 is not defined|document\.|window\.|dendryUI|getContext|setAttribute|classList|innerHTML|style\b/;

const realLog = console.log;
let CUR_SCENE = 'init', CUR_DATE = '';
let RT = {};
console.log = (...a) => {
  const first = String(a[0]);
  if (first.startsWith('Error')) {
    let msg = a.slice(1).map((x) => (x && x.message ? x.message : String(x))).join(' ').slice(0, 240);
    if (first.startsWith('Error in expression')) msg = '(predicate/expression) ' + msg;
    const key = CUR_SCENE + ' :: ' + msg;
    (RT[key] = RT[key] || { n: 0, first: CUR_DATE }).n++;
  }
};
global.window = { addEventListener() {}, localStorage: {}, dendryUI: null };
global.document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} }), body: { style: {} } };
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function UI() { this.choices = []; this.decks = []; this.pinned = []; this.texts = []; }
engine.UserInterface.makeParentOf(UI);
UI.prototype.displayContent = function (p) { try { this.texts.push(JSON.stringify(p)); } catch (e) {} };
UI.prototype.displayChoices = function (c) { this.choices = c; };
UI.prototype.displayDecks = function (d) { this.decks = d; };
UI.prototype.displayHand = function () {};
UI.prototype.displayPinnedCards = function (p) { this.pinned = p; };
UI.prototype.removeChoices = function () { this.choices = []; this.decks = []; this.pinned = []; };

function play(game, seed) {
  const rnd = mulberry32(seed);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  RT = {};
  const ui = new UI();
  const eng = new engine.DendryEngine(ui, game);
  global.dendryUI = { dendryEngine: eng, disable_bg: true, setBg() {} };
  global.window.dendryUI = global.dendryUI;
  const rep = { seed, steps: 0, fatal: null, stuck: null, gameOver: false, end: null,
    nan: {}, text: {}, scenes: {}, timeline: [], final: {} };
  const snap = () => { const q = eng.state.qualities, o = {}; for (const k of WATCH) o[k] = q[k]; return o; };
  let lastKey = '';
  try { eng.beginGame([seed, seed + 1, seed + 2, seed + 3, seed + 4]); }
  catch (e) { rep.fatal = { scene: 'BEGIN', msg: String(e.message).slice(0, 200) }; rep.runtime = RT; return rep; }

  for (let step = 0; step < MAX_STEPS; step++) {
    rep.steps = step;
    const q = eng.state.qualities, sid = eng.state.sceneId;
    CUR_SCENE = sid; CUR_DATE = q.year + '-' + q.month;
    rep.scenes[sid] = (rep.scenes[sid] || 0) + 1;
    for (const k in q) {
      if (typeof q[k] === 'number' && !isFinite(q[k]) && !rep.nan[k]) rep.nan[k] = { scene: sid, date: CUR_DATE, value: String(q[k]) };
    }
    for (const t of ui.texts) {
      for (const pat of ['undefined', 'NaN', '[object', 'Infinity']) {
        const i = t.indexOf(pat);
        if (i >= 0) { const key = pat + ' in ' + sid; if (!rep.text[key]) rep.text[key] = t.slice(Math.max(0, i - 70), i + 50); }
      }
    }
    ui.texts = [];
    const dk = q.year + '-' + q.month;
    if (dk !== lastKey) { lastKey = dk; rep.timeline.push(Object.assign({ date: dk }, snap())); }
    if (eng.isGameOver()) { rep.gameOver = true; rep.end = { scene: sid, date: dk }; break; }
    try {
      const scene = eng.getCurrentScene();
      if (scene.isHand) {
        const hand = eng.state.currentHands[sid] || [];
        const draws = ui.decks.filter((d) => d.canChoose);
        const opts = [];
        if (hand.length < (scene.maxCards || 0)) draws.forEach((d) => opts.push(['draw', d]));
        hand.forEach((c) => opts.push(['play', c]));
        ui.pinned.forEach((p) => opts.push(['pin', p]));
        if (!opts.length) { rep.stuck = { scene: sid, why: 'hand with no options', date: dk }; break; }
        const D = opts.filter((o) => o[0] === 'draw'), P = opts.filter((o) => o[0] === 'play'), N = opts.filter((o) => o[0] === 'pin');
        const r = rnd();
        const c = (D.length && hand.length < 2 && r < 0.8) ? pick(D) : (P.length && r < 0.75) ? pick(P) : N.length ? pick(N) : pick(opts);
        if (c[0] === 'draw') eng.drawCard(c[1].id); else if (c[0] === 'play') eng.playCard(c[1].id); else eng.playPinnedCard(c[1].id);
      } else {
        const ch = eng.getCurrentChoices() || [];
        const ok = []; ch.forEach((c, i) => { if (c.canChoose) ok.push(i); });
        if (!ok.length) { rep.stuck = { scene: sid, why: 'no choosable options', date: dk }; break; }
        eng.choose(pick(ok));
      }
    } catch (e) {
      rep.fatal = { scene: sid, date: dk, msg: String(e.message).slice(0, 200), stack: (e.stack || '').split('\n').slice(1, 3).join(' | ').slice(0, 260) };
      break;
    }
  }
  rep.final = snap(); rep.runtime = RT;
  return rep;
}

utils.loadCompiledGame(GAME, (err, game) => {
  if (err) { realLog('Cannot load ' + GAME + ': ' + err); process.exit(2); }
  const reports = [];
  for (let s = 1; s <= SEEDS; s++) reports.push(play(game, s));
  console.log = realLog;

  let bad = 0;
  realLog(`\n=== QA PLAYTEST: ${SEEDS} seeds x up to ${MAX_STEPS} steps on ${GAME} ===\n`);
  for (const r of reports) {
    const last = r.timeline[r.timeline.length - 1] || {};
    let line = `seed ${r.seed}: steps=${r.steps} reached=${last.date} ` +
      (r.gameOver ? `GAME OVER @${r.end.date} (${r.end.scene})` : r.fatal ? 'FATAL' : r.stuck ? 'STUCK' : 'step-limit');
    realLog(line);
    if (r.fatal) { bad++; realLog('   FATAL: ' + JSON.stringify(r.fatal)); }
    if (r.stuck) { bad++; realLog('   STUCK: ' + JSON.stringify(r.stuck)); }
  }
  const agg = {};
  reports.forEach((r) => Object.entries(r.runtime || {}).forEach(([k, v]) => {
    if (NOISE.test(k)) return;
    const a = agg[k] = agg[k] || { n: 0, seeds: new Set(), first: v.first };
    a.n += v.n; a.seeds.add(r.seed);
  }));
  const rows = Object.entries(agg).sort((a, b) => b[1].n - a[1].n);
  realLog(`\n--- SWALLOWED RUNTIME ERRORS (scene :: message) -- ${rows.length} distinct ---`);
  rows.slice(0, args.verbose ? 200 : 40).forEach(([k, v]) => realLog(`${String(v.n).padStart(5)}x seeds=${v.seeds.size} first=${v.first}  ${k}`));
  if (rows.length) bad++;

  const nan = {}; reports.forEach((r) => Object.entries(r.nan).forEach(([k, v]) => { nan[k] = nan[k] || v; }));
  const nanKeys = Object.keys(nan);
  realLog(`\n--- QUALITIES THAT BECAME NaN/Infinity -- ${nanKeys.length} ---`);
  nanKeys.slice(0, 40).forEach((k) => realLog(`  ${k}  (first seen in ${nan[k].scene} @${nan[k].date})`));
  if (nanKeys.length) bad++;

  const text = {}; reports.forEach((r) => Object.entries(r.text).forEach(([k, v]) => { text[k] = text[k] || v; }));
  const tk = Object.keys(text);
  realLog(`\n--- "undefined"/"NaN" LEAKING INTO PLAYER-VISIBLE TEXT -- ${tk.length} ---`);
  tk.slice(0, 25).forEach((k) => realLog(`  ${k}: ...${text[k].replace(/\\"/g, '"')}...`));
  if (tk.length) bad++;

  if (SCENE_RE) {
    const seen = {}; reports.forEach((r) => Object.entries(r.scenes).forEach(([s, n]) => { const b = s.split('.')[0]; seen[b] = (seen[b] || 0) + n; }));
    const all = Object.keys(game.scenes).map((s) => s.split('.')[0]).filter((v, i, a) => a.indexOf(v) === i).filter((s) => SCENE_RE.test(s)).sort();
    realLog(`\n--- SCENE COVERAGE for /${SCENE_RE.source}/ (total visits across all seeds) ---`);
    all.forEach((s) => realLog(`  ${String(seen[s] || 0).padStart(6)}  ${s}${seen[s] ? '' : '   <-- NEVER REACHED'}`));
  }
  if (args.timeline) {
    const r = reports.find((x) => x.timeline.length > 12) || reports[0];
    realLog(`\n--- TIMELINE seed ${r.seed} (every 6th month) ---`);
    r.timeline.filter((_, i) => i % 6 === 0).forEach((t) => realLog('  ' + JSON.stringify(t)));
  }
  realLog(bad ? `\nRESULT: PROBLEMS FOUND (${bad} categories)` : '\nRESULT: CLEAN');
  process.exit(bad ? 1 : 0);
});