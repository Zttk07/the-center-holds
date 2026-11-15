#!/usr/bin/env node
/**
 * Fix typo >== to >=
 */

const fs = require('fs');

// Read the file
const content = fs.readFileSync('source/scenes/events/election_1928.scene.dry', 'utf-8');

// Fix the typo
const fixedContent = content.replace(/>==/g, '>=');

fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v13) - fixed >== typo");