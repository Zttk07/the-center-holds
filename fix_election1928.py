#!/usr/bin/env python3
"""
Fix election_1928.scene.dry - wrap on-arrival blocks in {! ... !} and convert
inline conditionals to proper JS.
"""

import re

def fix_on_arrival_blocks(content):
    """Find and fix on-arrival blocks that need {! ... !} wrapping."""

    # Pattern to match on-arrival lines that are not already wrapped
    # They look like: on-arrival: var = value; var2 = value2; ...
    # We need to wrap the content in {! ... !} and fix inline conditionals

    lines = content.split('\n')
    output = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this line has an on-arrival that's not already wrapped
        if 'on-arrival:' in line and '{!' not in line:
            # Check if it's a comment or already wrapped
            stripped = line.strip()
            if stripped.startswith('on-arrival:'):
                # Find the content after "on-arrival:"
                prefix = line[:line.index('on-arrival:') + len('on-arrival:')]
                content_part = line[line.index('on-arrival:') + len('on-arrival:'):]

                # Fix inline conditionals: "var = value if condition" -> "if (condition) { var = value; }"
                # and "var += value if condition" -> "if (condition) { var += value; }"
                # and "var = value1 if condition else value2" -> "if (condition) { var = value1; } else { var = value2; }"

                # First, handle ternary operators: a = b if c else d
                # This is complex, let's do a more systematic approach
                content_part = fix_inline_conditionals(content_part)

                # Wrap in {! ... !}
                line = prefix + ' {! ' + content_part.strip() + ' !}'

        output.append(line)
        i += 1

    return '\n'.join(output)

def fix_inline_conditionals(text):
    """Convert inline conditionals to proper JS if statements."""

    # Pattern: var = value if condition
    # But need to be careful with string values containing "if"

    # First, let's handle the simple cases:
    # "var = value if condition" -> "if (condition) { var = value; }"
    # "var += value if condition" -> "if (condition) { var += value; }"
    # "var -= value if condition" -> "if (condition) { var -= value; }"

    # Split by semicolons to process each statement
    statements = text.split(';')
    result_statements = []

    for stmt in statements:
        stmt = stmt.strip()
        if not stmt:
            continue

        # Check if it has an inline conditional
        # Pattern: something = value if condition
        # But avoid matching inside strings

        # Simple approach: look for " if " not in quotes
        if ' if ' in stmt and not stmt.startswith('if '):
            # Find the last " if " that's not in a string
            # This is a heuristic - look for pattern: assignment = value if condition
            parts = stmt.split(' if ')
            if len(parts) == 2:
                assignment = parts[0].strip()
                condition = parts[1].strip()

                # Check if assignment is a simple assignment
                if '=' in assignment and not any(op in assignment for op in ['==', '!=', '<=', '>=']):
                    result_statements.append(f'if ({condition}) {{ {assignment}; }}')
                else:
                    result_statements.append(stmt)
            else:
                result_statements.append(stmt)
        else:
            result_statements.append(stmt)

    return '; '.join(result_statements)

# Read the file
with open('source/scenes/events/election_1928.scene.dry', 'r', encoding='utf-8') as f:
    content = f.read()

# First, let's do a more targeted fix - find all on-arrival lines and fix them
# We'll use a more precise regex

def fix_all_on_arrival(content):
    """Fix all on-arrival blocks in the file."""

    # Find all on-arrival lines that aren't already wrapped
    # Pattern: on-arrival: [content without {!]

    lines = content.split('\n')
    output = []

    for line in lines:
        # Check if this line has on-arrival but not already wrapped
        if 'on-arrival:' in line:
            stripped = line.strip()
            if stripped.startswith('on-arrival:') and '{!' not in line:
                # Extract prefix and content
                idx = line.index('on-arrival:')
                prefix = line[:idx + len('on-arrival:')]
                rest = line[idx + len('on-arrival:'):].strip()

                if rest and not rest.startswith('{!'):
                    # Fix inline conditionals in rest
                    fixed = fix_inline_conditionals_simple(rest)
                    line = prefix + ' {! ' + fixed + ' !}'

        output.append(line)

    return '\n'.join(output)

def fix_inline_conditionals_simple(text):
    """Simple fix for inline conditionals."""

    # Split by semicolon
    stmts = text.split(';')
    result = []

    for stmt in stmts:
        stmt = stmt.strip()
        if not stmt:
            continue

        # Handle: var = value if condition
        # Handle: var += value if condition
        # Handle: var = value1 if condition else value2

        # Check for ternary first (if ... else ...)
        if ' else ' in stmt and ' if ' in stmt:
            # Find the if and else positions
            if_pos = stmt.rfind(' if ')
            else_pos = stmt.rfind(' else ')
            if if_pos > 0 and else_pos > if_pos:
                before_if = stmt[:if_pos].strip()
                condition = stmt[if_pos + 4:else_pos].strip()
                after_else = stmt[else_pos + 6:].strip()

                if '=' in before_if and not any(op in before_if for op in ['==', '!=', '<=', '>=']):
                    result.append(f'if ({condition}) {{ {before_if}; }} else {{ {after_else}; }}')
                else:
                    result.append(stmt)
            else:
                result.append(stmt)
        elif ' if ' in stmt:
            # Simple if at the end
            parts = stmt.rsplit(' if ', 1)
            if len(parts) == 2:
                assignment = parts[0].strip()
                condition = parts[1].strip()

                # Check if it's an assignment
                if ('=' in assignment or '+=' in assignment or '-=' in assignment) and not any(op in assignment for op in ['==', '!=', '<=', '>=']):
                    result.append(f'if ({condition}) {{ {assignment}; }}')
                else:
                    result.append(stmt)
            else:
                result.append(stmt)
        else:
            result.append(stmt)

    return '; '.join(result)

# Apply the fix
fixed_content = fix_all_on_arrival(content)

# Write back
with open('source/scenes/events/election_1928.scene.dry', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("Fixed election_1928.scene.dry")