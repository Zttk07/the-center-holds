#!/usr/bin/env node
/**
 * More robust fix for election_1928.scene.dry - fix all on-arrival blocks
 */

const fs = require('fs');

function fixJSContent(text) {
    let result = text;

    // First, handle strings by temporarily replacing them
    const strings = [];
    let inString = false;
    let stringChar = '';
    let stringStart = -1;

    for (let i = 0; i < result.length; i++) {
        const char = result[i];

        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            stringStart = i;
        } else if (inString && char === stringChar && result[i-1] !== '\\') {
            inString = false;
            strings.push({ start: stringStart, end: i, content: result.substring(stringStart, i + 1) });
        }
    }

    // Replace strings with placeholders
    let tempResult = result;
    for (let i = strings.length - 1; i >= 0; i--) {
        const s = strings[i];
        tempResult = tempResult.substring(0, s.start) + `__STRING_${i}__` + tempResult.substring(s.end + 1);
    }

    // Now fix JS operators in the temp result
    tempResult = tempResult.replace(/\bnot\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, '!$1');
    tempResult = tempResult.replace(/\band\b/g, '&&');
    tempResult = tempResult.replace(/\bor\b/g, '||');

    // Fix = to == in comparison contexts (but not assignments)
    // Pattern: (var = value) where not ==, !=, <=, >=
    tempResult = tempResult.replace(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=!<>][^)]*)\)/g, '($1 == $2)');
    tempResult = tempResult.replace(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=!<>][^&\|)]*)/g, '($1 == $2)');

    // Restore strings
    for (let i = 0; i < strings.length; i++) {
        tempResult = tempResult.replace(`__STRING_${i}__`, strings[i].content);
    }

    return tempResult;
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
        const endIdx = line.lastIndexOf('!}');  // Use lastIndexOf in case there are multiple
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

const fixedContent = output.join('\n');
fs.writeFileSync('source/scenes/events/election_1928.scene.dry', fixedContent, 'utf-8');

console.log("Fixed election_1928.scene.dry (v11) - robust JS fix");