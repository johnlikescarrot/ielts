import re

with open('AGENTS.md', 'r') as f:
    content = f.read()

content = content.replace('`` (shown below as `', '` (shown below as `')
content = content.replace('&lt;slug&gt;``, or `', '&lt;slug&gt;`, or `')
content = content.replace('&lt;Name&gt;`` / `', '&lt;Name&gt;` / `')
content = content.replace('``', '`')

with open('AGENTS.md', 'w') as f:
    f.write(content)
