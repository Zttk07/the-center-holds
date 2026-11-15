#!/usr/bin/env node
/**
 * Fix election_1928.scene.dry - fix "and"/"or" to "&&"/"||" inside {! ... !} blocks.
 */

const fs = require('fs');

function fixJSOperators(text) {
    // Replace "and" with "&&" and "or" with "||" in JS expressions
    // But be careful not to replace in strings
    let result = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            result += char;
        } else if (inString && char === stringChar && text[i-1] !== '\\') {
            inString = false;
            result += char;
        } else if (!inString) {
            // Check for " and " or " or "
            if (text.substring(i, i + 5) === ' and ') {
                result += ' && ';
                i += 4;
            } else if (text.substring(i, i + 4) === ' or ') {
                result += ' || ';
                i += 3;
            } else {
                result += char;
            }
        } else {
            result += char;
        }
    }

    return result;
}

function fixExistingOnArrival(content) {
    const lines = content.split('\n');
    const output = [];

    for (const line of lines) {
        // Check if this line has on-arrival with {! ... !}
        if (line.includes('on-arrival:') && line.includes('{!')) {
            // Find the {! and !} positions
            const startIdx = line.indexOf('{!');
            const endIdx = line.indexOf('!}');
            if (startIdx >= 0 && endIdx > startIdx) {
                const prefix = line.substring(0, startIdx + 2);
                const jsContent = line.substring(startIdx + 2, endIdx);
                const suffix = line.substring(endIdx);

                // Fix JS operators in the content
                const fixedContent = fixJSOperators(jsContent);
                output.push(prefix + fixedContent + suffix);
            } else {
                output.push(line);
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
const fixedContent = fixExistingOnArrival(content);

// Write back
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v3) - fixed and/or in existing {! !} blocks");