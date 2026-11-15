#!/usr/bin/env node
/**
 * Comprehensive fix for election_1928.scene.dry on-arrival blocks:
 * - Fix "not X" to "!X"
 * - Fix "and"/"or" to "&&"/"||"
 * - Fix "=" to "==" in comparisons (not assignments)
 */

const fs = require('fs');

function fixJSContent(text) {
    let result = text;

    // Fix "not X" -> "!X" where X is a variable name
    // But be careful not to replace in strings
    let inString = false;
    let stringChar = '';
    let tempResult = '';

    for (let i = 0; i < result.length; i++) {
        const char = result[i];

        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            tempResult += char;
        } else if (inString && char === stringChar && result[i-1] !== '\\') {
            inString = false;
            tempResult += char;
        } else if (!inString) {
            // Check for " not " followed by variable name
            if (result.substring(i, i + 5) === ' not ') {
                // Check what comes after
                let j = i + 5;
                while (j < result.length && result[j] === ' ') j++;
                let varName = '';
                while (j < result.length && /[a-zA-Z_$][a-zA-Z0-9_$]*/.test(result[j])) {
                    varName += result[j];
                    j++;
                }
                if (varName) {
                    tempResult += ' !' + varName;
                    i = j - 1;
                } else {
                    tempResult += ' not ';
                    i += 4;
                }
            }
            // Check for " and " -> " && "
            else if (result.substring(i, i + 5) === ' and ') {
                tempResult += ' && ';
                i += 4;
            }
            // Check for " or " -> " || "
            else if (result.substring(i, i + 4) === ' or ') {
                tempResult += ' || ';
                i += 3;
            } else {
                tempResult += char;
            }
        } else {
            tempResult += char;
        }
    }

    result = tempResult;

    // Fix "=" to "==" in comparison contexts
    // Pattern: if (var = value) -> if (var == value)
    // But not in assignments like var = 5
    // Use regex to find = in conditions
    result = result.replace(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=!<>][^)]*)\)/g, '($1 == $2)');
    result = result.replace(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=!<>][^&\|)]*)/g, '($1 == $2');

    return result;
}

function fixAllOnArrival(content) {
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

                // Fix JS content
                const fixedContent = fixJSContent(jsContent);
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
const fixedContent = fixAllOnArrival(content);

// Write back
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v10) - comprehensive JS fix");