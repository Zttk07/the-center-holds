#!/usr/bin/env node
/**
 * Fix election_1928.scene.dry - fix go-to update_faction_strengths to call:
 * and remove duplicate go-to lines
 */

const fs = require('fs');

function fixGoToToCall(content) {
    const lines = content.split('\n');
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Fix "go-to: update_faction_strengths" to "call: update_faction_strengths"
        if (line.trim() === 'go-to: update_faction_strengths') {
            console.log(`Fixing line ${i + 1}: go-to -> call`);
            output.push('call: update_faction_strengths');
            continue;
        }

        output.push(line);
    }

    return output.join('\n');
}

// Read the file
const content = fs.readFileSync('source/scenes/events/election_1928.scene.dry', 'utf-8');

// Apply the fix
const fixedContent = fixGoToToCall(content);

// Write back
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v9) - fixed go-to update_faction_strengths");