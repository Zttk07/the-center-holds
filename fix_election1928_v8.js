#!/usr/bin/env node
/**
 * Fix election_1928.scene.dry - remove external go-to when on-arrival already has it inside {! !}
 */

const fs = require('fs');

function fixExternalGoToAfterOnArrival(content) {
    const lines = content.split('\n');
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line is an on-arrival with {! ... go-to: ... !}
        if (line.includes('on-arrival:') && line.includes('{!') && line.includes('go-to:')) {
            output.push(line);
            // Skip the next line if it's the same go-to
            let nextIdx = i + 1;
            while (nextIdx < lines.length && lines[nextIdx].trim() === '') {
                nextIdx++;
            }
            if (nextIdx < lines.length) {
                const nextLine = lines[nextIdx].trim();
                // Extract go-to from the on-arrival
                const startIdx = line.indexOf('{!');
                const endIdx = line.indexOf('!}');
                if (startIdx >= 0 && endIdx > startIdx) {
                    const jsContent = line.substring(startIdx + 2, endIdx);
                    const goToMatch = jsContent.match(/go-to:\s*([^;]+)/);
                    if (goToMatch && nextLine === 'go-to: ' + goToMatch[1].trim()) {
                        console.log(`Removing duplicate external go-to at line ${nextIdx + 1}: ${nextLine}`);
                        i = nextIdx; // Skip it
                        continue;
                    }
                }
            }
        } else {
            output.push(line);
        }
    }

    return output.join('\n');
}

// Read the file
const content = fs.readFileSync('source/scenes/events/election_1928.scene.dry', 'utf-8');

// Apply the fix
const fixedContent = fixExternalGoToAfterOnArrival(content);

// Write back
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v8) - removed external go-to after on-arrival with internal go-to");