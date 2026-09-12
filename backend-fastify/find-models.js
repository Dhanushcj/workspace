const fs = require('fs');
const code = fs.readFileSync('src/services/aiService.ts', 'utf8');
const matches = [...code.matchAll(/model[\s:=]+['"]([^'"]+)['"]/g)];
matches.forEach(m => console.log(m[1]));
