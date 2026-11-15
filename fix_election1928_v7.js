#!/usr/bin/env node
/**
 * Fix election_1928.scene.dry - remove unconditional go-to when there's a conditional one
 * The parser doesn't allow multiple go-to lines for the same section
 */

const fs = require('fs');

function fixDuplicateGoTo(content) {
    const lines = content.split('\n');
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line is an unconditional go-to and the next line is a conditional go-to
        if (line.trim().startsWith('go-to:') && !line.trim().includes(' if ')) {
            // Check if next non-empty line is also a go-to (conditional)
            let nextIdx = i + 1;
            while (nextIdx < lines.length && lines[nextIdx].trim() === '') {
                nextIdx++;
            }
            if (nextIdx < lines.length) {
                const nextLine = lines[nextIdx].trim();
                if (nextLine.startsWith('go-to:') && nextLine.includes(' if ')) {
                    console.log(`Removing unconditional go-to at line ${i + 1}: ${line.trim()}`);
                    console.log(`  Keeping conditional go-to at line ${nextIdx + 1}: ${nextLine}`);
                    continue; // Skip this line
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

console.log("Fixed election_1928.scene.dry (v7) - removed unconditional go-to before conditional");