#!/usr/bin/env node
/**
 * Fix election_1928.scene.dry - wrap on-arrival blocks in {! ... !} and convert
 * inline conditionals to proper JS, and fix "and"/"or" to "&&"/"||".
 */

const fs = require('fs');

function fixInlineConditionalsSimple(text) {
    // Split by semicolon
    const stmts = text.split(';');
    const result = [];

    for (const stmt of stmts) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;

        // Handle: var = value if condition
        // Handle: var += value if condition
        // Handle: var = value1 if condition else value2

        // Check for ternary first (if ... else ...)
        if (trimmed.includes(' else ') && trimmed.includes(' if ')) {
            // Find the if and else positions
            const ifPos = trimmed.lastIndexOf(' if ');
            const elsePos = trimmed.lastIndexOf(' else ');
            if (ifPos > 0 && elsePos > ifPos) {
                const beforeIf = trimmed.substring(0, ifPos).trim();
                const condition = trimmed.substring(ifPos + 4, elsePos).trim();
                const afterElse = trimmed.substring(elsePos + 6).trim();

                if (beforeIf.includes('=') && !['==', '!=', '<=', '>='].some(op => beforeIf.includes(op))) {
                    result.push(`if (${condition}) { ${beforeIf}; } else { ${afterElse}; }`);
                } else {
                    result.push(trimmed);
                }
            } else {
                result.push(trimmed);
            }
        } else if (trimmed.includes(' if ')) {
            // Simple if at the end
            const parts = trimmed.split(' if ');
            if (parts.length === 2) {
                const assignment = parts[0].trim();
                const condition = parts[1].trim();

                // Check if it's an assignment
                if ((assignment.includes('=') || assignment.includes('+=') || assignment.includes('-='))
                    && !['==', '!=', '<=', '>='].some(op => assignment.includes(op))) {
                    result.push(`if (${condition}) { ${assignment}; }`);
                } else {
                    result.push(trimmed);
                }
            } else {
                result.push(trimmed);
            }
        } else {
            result.push(trimmed);
        }
    }

    return result.join('; ');
}

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

function fixAllOnArrival(content) {
    const lines = content.split('\n');
    const output = [];

    for (const line of lines) {
        // Check if this line has on-arrival but not already wrapped
        if (line.includes('on-arrival:')) {
            const stripped = line.trim();
            if (stripped.startsWith('on-arrival:') && !line.includes('{!')) {
                // Extract prefix and content
                const idx = line.indexOf('on-arrival:');
                const prefix = line.substring(0, idx + 'on-arrival:'.length);
                const rest = line.substring(idx + 'on-arrival:'.length).trim();

                if (rest && !rest.startsWith('{!')) {
                    // Fix inline conditionals in rest
                    let fixed = fixInlineConditionalsSimple(rest);
                    // Fix JS operators
                    fixed = fixJSOperators(fixed);
                    output.push(prefix + ' {! ' + fixed + ' !}');
                } else {
                    output.push(line);
                }
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

console.log("Fixed election_1928.scene.dry (v2)");