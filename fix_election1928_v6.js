#!/usr/bin/env node
/**
 * Fix election_1928.scene.dry - remove duplicate go-to lines after on-arrival blocks
 * The parser doesn't allow multiple go-to lines for the same section
 */

const fs = require('fs');

function fixDuplicateGoTo(content) {
    const lines = content.split('\n');
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line is a go-to and the previous line was also a go-to
        // or if the previous line was an on-arrival block with go-to inside
        if (line.trim().startsWith('go-to:')) {
            // Check if previous non-empty line was also go-to or was an on-arrival with go-to
            let prevIdx = i - 1;
            while (prevIdx >= 0 && lines[prevIdx].trim() === '') {
                prevIdx--;
            }
            if (prevIdx >= 0) {
                const prevLine = lines[prevIdx].trim();
                // If previous line is also a go-to, skip this one
                if (prevLine.startsWith('go-to:')) {
                    console.log(`Removing duplicate go-to at line ${i + 1}: ${line.trim()}`);
                    continue;
                }
            }
        }
        output.push(line);
    }

    return output.join('\n');
}

// Read the file
const content = fs.readFileSync('source/scenes/events/election_1928.scene.dry', 'utf-8');

// Apply the fix
const fixedContent = fixDuplicateGoTo(content);

// Write back
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v6) - removed duplicate go-to lines");