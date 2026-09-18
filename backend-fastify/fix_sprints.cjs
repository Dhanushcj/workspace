const fs = require('fs');
let data = fs.readFileSync('src/services/aiService.ts', 'utf8');

const regex = /if \(!s\.name \|\| s\.name === \`Sprint \$\{idx \+ 1\}\`\) \{[\s\S]*?\} else if \(!s\.name\.startsWith\('Sprint'\)\) \{\s*s\.name = \`Sprint \$\{idx \+ 1\}: \$\{s\.name\}\`;\s*\}/g;

const replacement = `s.name = (s.name || '').replace(/^Sprint\\s*\\d+\\s*:\\s*/i, '').replace(/^Sprint\\s*\\d+\\s*/i, '');
    s.name = \`Sprint \${idx + 1}: \${s.name || 'Core Features'}\`;`;

data = data.replace(regex, replacement);

fs.writeFileSync('src/services/aiService.ts', data);
