import re, sys

filepath = sys.argv[1]
with open(filepath, 'r') as f:
    content = f.read()

count = 0

# Pattern: oklch(... ... 160 / ...)  (with alpha, 3-space format before /)
def repl_alpha(m):
    global count
    count += 1
    return f'oklch({m.group(1)} {m.group(2)} 85 / {m.group(3)})'

def repl_simple(m):
    global count
    count += 1
    return f'oklch({m.group(1)} {m.group(2)} 85)'

content = re.sub(r'oklch\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?) 160 / (\d+(?:\.\d+)?%?)\)', repl_alpha, content)
content = re.sub(r'oklch\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?) 160\)', repl_simple, content)

with open(filepath, 'w') as f:
    f.write(content)

print(f'Replaced {count} occurrences')
