# Phase 0: Audit and Plan — Zentrum Total Conversion Mod

## 1. Mapping of Spec Mechanics to Files/Variables

| Spec Section | Mechanic | Existing Files to Modify | New Files to Create | New Q.* Variables |
|--------------|----------|-------------------------|---------------------|-------------------|
| **1. Scaffolding** | New info.dry, start menu, modinfo, credits, changelog | source/info.dry, root.scene.dry, modinfo.scene.dry, credits.scene.dry, changes.txt | — | player_party, all new faction vars, bvp_*, presidential_opinion, barons_*, anti_fascist_*, coalition_type, out_of_government_malus, split flags |
| **2. Factions** | Five factions + Barons + BVP | root.scene.dry (init), z_party_hub.scene.dry, qdisplays/strength.qdisplay.dry, qdisplays/dissent.qdisplay.dry | qdisplays/left_strength.qdisplay.dry, qdisplays/center_strength.qdisplay.dry, qdisplays/right_strength.qdisplay.dry, qdisplays/christian_unity_strength.qdisplay.dry, qdisplays/anti_fascist_strength.qdisplay.dry, qdisplays/barons_strength.qdisplay.dry | left_strength, left_dissent, center_strength, center_dissent, right_strength, right_dissent, christian_unity_strength, christian_unity_dissent, anti_fascist_strength, anti_fascist_dissent, barons_strength, barons_dissent, anti_fascist_path_committed, anti_fascist_available |
| **3. Coalition→Faction Strength** | Coalition type mapping (§3.1 table) | z_govt_hub.scene.dry (coalition_event), election_algorithm.scene.dry | — | coalition_type, coalition_types array |
| **3.2 Out of Government Malus** | Malus when Z excluded & opposition coalitions govern | z_govt_hub.scene.dry (parliamentary_affairs), main.scene.dry (monthly loop), status.scene.dry | — | out_of_government_malus |
| **4. BVP Relations/Integration** | Two sliders, 5 Integration levels, unlocks | z_party_hub.scene.dry (bvp_relations), root.scene.dry | — | bvp_relations (0-100), bvp_integration (0-4), bvp_integration_sticky flag |
| **5. Presidential Opinion** | 0-100 scale, 5 levels, ouster rules, succession | z_govt_hub.scene.dry (presidential_relations), root.scene.dry, presidential_election_1932_*.scene.dry, death_of_hindenburg_*.scene.dry | events/hindenburg_ouster.scene.dry, events/presidential_election_1934.scene.dry | presidential_opinion (0-100), papen_recruited, schleicher_recruited, krosigk_recruited, eltz_rubenach_recruited, reichswehr_investment |
| **6. Barons Faction** | 4 advisors with unlock gates | z_advisors_hub.scene.dry | advisors/papen.scene.dry, advisors/schleicher.scene.dry, advisors/krosigk.scene.dry, advisors/eltz_rubenach.scene.dry | (all in root already) |
| **7. Party Splits** | 5 split events with exact effects | events/center_party_conference*.scene.dry | events/z_split_left.scene.dry, events/z_split_center.scene.dry, events/z_split_right.scene.dry, events/z_split_christian_unity.scene.dry, events/z_split_anti_fascist.scene.dry | left_leaders_resigned, center_leaders_resigned, right_wing_left, christian_unity_left, anti_fascists_left |
| **8. Presidential Elections 1932/1934** | Candidate gating, support rules, Eckener, Thälmann ban | presidential_election_1932_*.scene.dry, death_of_hindenburg_*.scene.dry, game_over.scene.dry | events/presidential_election_1934.scene.dry | hindenburg_died_1934, presidential_election_1934_phase |

## 2. SPD-Player Content: Reuse / Convert / Neutralize / Delete

| Content Category | Existing Files | Action |
|-----------------|---------------|--------|
| **SPD Faction System** (left, center, labor, reformist, neorevisionist, social_patriot) | root.scene.dry, qdisplays/strength.qdisplay.dry, qdisplays/dissent.qdisplay.dry | **DELETE/REPLACE** — Zentrum has entirely different factions |
| **SPD Advisors** (Wels, Müller, Hilferding, Sender, Levi, etc.) | advisors/*.scene.dry, root.scene.dry (advisor flags) | **NEUTRALIZE** — Keep files but gate behind `player_party == 'spd'`; Z uses its own advisors |
| **SPD Party Hub** | party_affairs/spd_party_hub.scene.dry (and related) | **NEUTRALIZE** — Gate behind `player_party == 'spd'` |
| **SPD Govt Hub** | government_affairs/spd_govt_hub.scene.dry | **NEUTRALIZE** — Gate behind `player_party == 'spd'` |
| **SPD-specific Events** (reichsbanner, iron_front, neorevisionism, peoples_party, etc.) | events/*.scene.dry, party_affairs/*.scene.dry | **NEUTRALIZE** — Gate or convert to Z-perspective where historical |
| **SPD Leadership/Chancellor Logic** | root.scene.dry (spd_* vars), election_algorithm.scene.dry | **CONVERT** — SPD becomes AI party; keep electorate mechanics but reverse perspective |
| **SPD Achievements** | game_over.scene.dry | **NEUTRALIZE** — Gate behind `player_party == 'spd'`; add Z achievements |
| **Status/Library Display** | status.scene.dry, library.scene.dry | **CONVERT** — Show Z-relevant info when `player_party == 'z'` |
| **Election Algorithm** | election_algorithm.scene.dry | **REUSE** — Works for all parties; Z uses it as player |
| **Coalition Flags** (in_weimar_coalition, in_grand_coalition, etc.) | root.scene.dry, main.scene.dry | **REUSE** — Same flags, Z-centric interpretation |
| **Hindenburg System** (hindenburg_relation, hindenburg_angry, etc.) | root.scene.dry, events/hindenburg_*.scene.dry | **EXTEND** — Add presidential_opinion meter; keep legacy vars for AI logic |
| **BVP Variables** (bvp_r, bvp_votes, kvp_formed, kvp_relation, etc.) | root.scene.dry, election_algorithm.scene.dry | **REUSE & RECONCILE** — Map to new bvp_relations/bvp_integration |
| **Presidential Elections 1932** | events/presidential_election_1932_*.scene.dry | **ADAPT** — Add Z candidates, gating by faction state |
| **Death of Hindenburg** | events/death_of_hindenburg_*.scene.dry | **ADAPT** — Ensure Aug 1934 death, Oct 1934 election runs |
| **Game Over / Endings** | game_over.scene.dry, ending_slides.scene.dry | **EXTEND** — Add Z endings; move hard cutoff past Oct 1934 |

## 3. Assumptions (from ambiguity_defaults + code review)

| ID | Assumption | Resolution |
|----|-----------|------------|
| A1 | Number of cabinets excluding Zentrum (4 vs 3) | Use 4 (Ebert, Papen, Schleicher, Hitler) as per Part 1 with named examples. No code impact. |
| A2 | Ouster succession wording | Use §5.3 table as ground truth: Papen not recruited → Papen cabinet; Papen recruited → Schleicher; both recruited pre-1932 → DNVP; both post-1932 → NSDAP. |
| A3 | "Verfungs" coalition name | Internal ID: `verfassungs`, display: "Verfassungskoalition" (Constitutional Coalition). |
| A4 | Poor vs Very Poor thresholds | Default: Poor (21-40) ousts; Papen recruited → Poor safe, Very Poor (0-20) ousts; Papen candidacy req > Poor; Schleicher req > Very Poor. |
| A5 | "Anti-Fascism is accepted" | Implement as explicit flag `anti_fascist_path_committed = 1` set by event/action, requiring `anti_fascist_strength >= 30` (TUNABLE). |
| A6 | Faction strengthening by coalition | Anti-Fascist strengthened by Left AND Center coalitions (per §3.1), not Right. |
| A7 | BVP existing variables | `bvp_r` = Reichstag %, `bvp_votes` = vote %, `kvp_formed` = Conservative People's Party formed, `kvp_relation` = relation with KVP, `kvp_r_bavaria` = KVP in Bavaria. New `bvp_relations` (0-100 opinion) and `bvp_integration` (0-4 level) are separate sliders. |
| A8 | Game end cutoff | Current game_over triggers at Aug 1934. Must extend to allow Oct 1934 presidential election. |
| A9 | Caretaker cabinet exemption | Detect via `minority_government == 1` AND no `chancellor_party` in {SPD, Z, KPD, NSDAP, DNVP} — i.e., presidential cabinet without parliamentary backing. |
| A10 | "Right wing leaves" split creates national party aligned with BVP | New party `national_conservative` (or similar) with vote share drawn from `catholics_dnvp`, `rural_dnvp`, `old_middle_dnvp`; increases `bvp_votes` base by TUNABLE amount. |

## 4. TUNABLES Table (All New Numeric Constants)

| Constant | Default | Spec Section | Notes |
|----------|---------|--------------|-------|
| FACTION_STRENGTH_GAIN_PER_COALITION | 3 | §3 | Applied to favored faction(s) when coalition formed |
| FACTION_STRENGTH_DECAY_PER_MONTH | 1 | §2.3 | Strength is fluid; auto-decay toward center |
| DISSENT_CHANGE_RATE | 0.5x strength rate | §2.3 | Dissent more rigid; changes half as fast |
| BVP_RELATIONS_GAIN_PER_ACTION | 5 | §4.1 | z_bvp_relations action |
| BVP_RELATIONS_DECAY_LOW_OPINION | -3/month | §4.2 | When relations < 30 |
| BVP_INTEGRATION_COST_SEPARATE_TO_ALIGNED | 3 resources | §4.3 | Stickiness: harder to leave Separate |
| BVP_INTEGRATION_COST_ALIGNED_TO_ASSOCIATED | 2 resources | §4.3 | |
| BVP_INTEGRATION_COST_ASSOCIATED_TO_ENMESHED | 2 resources | §4.3 | |
| BVP_INTEGRATION_COST_ENMESHED_TO_UNIFIED | 3 resources | §4.3 | Stickiness: harder to reach Unified |
| BVP_INTEGRATION_DECAY_AT_LOW_RELATIONS | 1 level per 3 months | §4.3 | If relations < 20 |
| PRESIDENTIAL_OPINION_GAIN_VISIT | +3 to +8 | §5.1 | z_presidential_relations action |
| PRESIDENTIAL_OPINION_LOSS_LEFT_COALITION | -5/month | §5.1 | When in Left-type coalition |
| PRESIDENTIAL_OPINION_LOSS_RIGHT_COALITION | -2/month | §5.1 | When in Right-type coalition |
| PRESIDENTIAL_OPINION_LOSS_ANTI_FASCIST_ACTION | -3/action | §5.1 | Anti-fascist actions anger Hindenburg |
| OUSTER_THRESHOLD_DEFAULT | <= 20 (Very Poor) | §5.3 | Actually Poor (21-40) ousts by default per A4 |
| OUSTER_THRESHOLD_WITH_PAPEN | <= 0 (Very Poor) | §5.3 | Poor no longer ousts if Papen recruited |
| REICHSWEHR_INVESTMENT_FOR_SCHLEICHER | 3 | §6 | Cumulative investment actions |
| BARONS_CABINET_DVP_SUPPORT | 15% | §6 | DVP, Others, DNVP backing |
| SPLIT_PROBABILITY_BASE | 0.02/month | §7 | Base chance per month when conditions met |
| SPLIT_PROBABILITY_MULTIPLIER | 2.0 | §7 | Harder than SPD splits (spec) |
| ANTI_FASCIST_COMMIT_THRESHOLD | 30 strength | §2.4, A5 | Minimum strength to commit |
| OUT_OF_GOVERNMENT_MALUS_MAX | 20 | §3.2 | Cap on malus |
| OUT_OF_GOVERNMENT_MALUS_GROWTH | +3/month | §3.2 | When malus conditions met |
| OUT_OF_GOVERNMENT_MALUS_DECAY | -2/month | §3.2 | When Z in government or caretaker |
| ECKENER_ANGER_THRESHOLD | dnvp_relation > 40 or nsdap_relation > 10 | §8.3 | "Flirted with fascists" |
| THALMANN_NEVER_SUPPORTABLE | Hard-coded | §8.4 | Never appears as supportable candidate |

## 5. New Files to Create (Phase-by-Phase)

### Phase 1: Scaffolding
- `source/info.dry` (modify)
- `source/scenes/root.scene.dry` (modify — already has Z vars initialized)
- `source/scenes/modinfo.scene.dry` (modify — add Z FAQ/paths)
- `source/changes.txt` (append)
- `source/credits_images.txt` (append placeholder list)
- `source/credits_music.txt` (verify)

### Phase 2: Factions & Coalition Strength
- `source/qdisplays/left_strength.qdisplay.dry`
- `source/qdisplays/center_strength.qdisplay.dry`
- `source/qdisplays/right_strength.qdisplay.dry`
- `source/qdisplays/christian_unity_strength.qdisplay.dry`
- `source/qdisplays/anti_fascist_strength.qdisplay.dry`
- `source/qdisplays/barons_strength.qdisplay.dry`
- `source/scenes/party_affairs/z_faction_detail.scene.dry` (new detail view)
- Modify: `z_party_hub.scene.dry`, `z_govt_hub.scene.dry`

### Phase 3: Out of Government Malus
- `source/scenes/party_affairs/z_malus_display.scene.dry` (status integration)
- Modify: `z_govt_hub.scene.dry`, `main.scene.dry` (monthly loop), `status.scene.dry`

### Phase 4: BVP Relations/Integration
- `source/scenes/party_affairs/z_bvp_integration.scene.dry` (integration actions)
- `source/scenes/events/bvp_integration_change.scene.dry` (auto-decay/events)
- `source/scenes/advisors/held.scene.dry`, `schaeffer.scene.dry`, `kahr.scene.dry`
- Modify: `z_party_hub.scene.dry`, `root.scene.dry`

### Phase 5: Presidential Opinion & Barons
- `source/scenes/events/hindenburg_ouster.scene.dry`
- `source/scenes/advisors/papen.scene.dry`, `schleicher.scene.dry`, `krosigk.scene.dry`, `eltz_rubenach.scene.dry` (already exist in z_advisors_hub but need full scene files)
- `source/scenes/events/barons_cabinet.scene.dry`
- Modify: `z_govt_hub.scene.dry`, `z_advisors_hub.scene.dry`, `presidential_election_1932_*.scene.dry`

### Phase 6: Party Splits
- `source/scenes/events/z_split_left.scene.dry`
- `source/scenes/events/z_split_center.scene.dry`
- `source/scenes/events/z_split_right.scene.dry`
- `source/scenes/events/z_split_christian_unity.scene.dry`
- `source/scenes/events/z_split_anti_fascist.scene.dry`
- Modify: `center_party_conference*.scene.dry`

### Phase 7: Presidential Elections 1932/1934
- `source/scenes/events/presidential_election_1934.scene.dry`
- `source/scenes/events/death_of_hindenburg_1934.scene.dry`
- Modify: `game_over.scene.dry` (extend cutoff), `presidential_election_1932_*.scene.dry` (add Z candidates)

### Phase 8: Polish & QA
- `source/scenes/debug_z.scene.dry` (gated debug scene)
- Modify: `status.scene.dry`, `library.scene.dry`, `modinfo.scene.dry`, `ending_slides.scene.dry`, `changes.txt`

## 6. Build Verification Plan

After each phase:
1. Run `npx dendrynexus make-html` — must succeed with 0 errors
2. Check `out/html/game.json` exists and is valid JSON
3. Load in browser via `index.html` — start game, advance 3-6 months
4. Verify no "undefined" errors in console
5. Verify new variables appear in status/debug

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Undefined variables | Every new Q.* initialized in root.scene.dry @start AND in all difficulty mode on-arrival blocks |
| Circular go-to / missing @ids | Grep all `go-to:` and `@id:` after each phase; verify targets exist |
| Unbalanced [? ?] / {! !} | Count opening/closing brackets in each modified file |
| SPD content leaking through | All SPD-specific cards gated with `view-if: player_party == 'spd'` or `choose-if: player_party == 'spd'` |
| Election algorithm breaking | Run election_algorithm.scene.dry in isolation; verify z_r, z_votes update correctly |

## 8. Next Steps

**Immediate:** Begin Phase 1 implementation. The repo already has Z variables initialized in root.scene.dry and basic hub scenes (z_party_hub, z_govt_hub, z_advisors_hub). Phase 1 will:
1. Finalize info.dry with new title/author/ifid
2. Ensure start menu leads to Z 1928 start
3. Verify monthly loop runs without SPD-specific blockers
4. Add placeholder qdisplays for new faction strengths

---

*Prepared for Zentrum Mod implementation. All mechanics per community design spec (Part 1 & 2).*