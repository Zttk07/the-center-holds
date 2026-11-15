#!/usr/bin/env node
/**
 * Fix assignment in if conditions - = should be ==
 */

const fs = require('fs');

function fixAssignmentInIf(text) {
    // Fix = to == in if conditions
    // Pattern: if (var = value) -> if (var == value)
    // But not in assignments like var = 5

    // Use a more careful approach - find if ( ... = ... ) patterns
    return text.replace(/if\s*\(([^)]+)\=([^=<>!])/g, 'if ($1==$2');
}

// Read the file
const content = fs.readFileSync('source/scenes/events/election_1928.scene.dry', 'utf-8');

// Find all on-arrival lines and fix them
const lines = content.split('\n');
const output = [];

for (const line of lines) {
    if (line.includes('on-arrival:') && line.includes('{!')) {
        // Find the {! and !} positions
        const startIdx = line.indexOf('{!');
        const endIdx = line.lastIndexOf('!}');
        if (startIdx >= 0 && endIdx > startIdx) {
            const prefix = line.substring(0, startIdx + 2);
            const jsContent = line.substring(startIdx + 2, endIdx);
            const suffix = line.substring(endIdx);

            // Fix JS content
            const fixedContent = fixAssignmentInIf(jsContent);
            output.push(prefix + fixedContent + suffix);
        } else {
            output.push(line);
        }
    } else {
        output.push(line);
    }
}

const fixedContent = output.join('\n');
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v12) - fixed assignment in if");