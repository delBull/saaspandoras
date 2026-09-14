import fs from 'fs';
let content = fs.readFileSync('../../task.md', 'utf-8');
content = content.replace('`[ ]` 1.1', '`[x]` 1.1');
content = content.replace('`[ ]` 1.2', '`[/]` 1.2');
fs.writeFileSync('../../task.md', content);
