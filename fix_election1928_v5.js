#!/usr/bin/env node
/**
 * Fix election_1928.scene.dry - remove go-to from inside {! ... !} blocks
 * and fix other issues.
 */

const fs = require('fs');

function fixGoToInOnArrival(content) {
    const lines = content.split('\n');
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line has on-arrival with {! ... go-to: ... !}
        if (line.includes('on-arrival:') && line.includes('{!') && line.includes('go-to:')) {
            // Find the {! and !} positions
            const startIdx = line.indexOf('{!');
            const endIdx = line.indexOf('!}');
            if (startIdx >= 0 && endIdx > startIdx) {
                const prefix = line.substring(0, startIdx + 2);
                const jsContent = line.substring(startIdx + 2, endIdx);
                const suffix = line.substring(endIdx);

                // Extract go-to from jsContent
                const goToMatch = jsContent.match(/go-to:\s*([^;]+)/);
                if (goToMatch) {
                    // Remove go-to from jsContent
                    const fixedJS = jsContent.replace(/go-to:\s*[^;]+;?\s*/, '');
                    output.push(prefix + fixedJS + suffix);
                    // Add go-to as separate line after this line
                    output.push('go-to: ' + goToMatch[1].trim());
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
const fixedContent = fixGoToInOnArrival(content);

// Write back
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v5) - removed go-to from {! !} blocks");