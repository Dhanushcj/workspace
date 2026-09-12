const fs = require('fs');
const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/\[\.\.\.new Set\(\[\.\.\.\(existing\.requirementIds \|\| \[\]\), \.\.\.\(mod\.requirementIds \|\| \[\]\)\]\)\]/g, 'Array.from(new Set([...(existing.requirementIds || []), ...(mod.requirementIds || [])]))');
code = code.replace(/\[\.\.\.new Set\(allAssumptions\)\]/g, 'Array.from(new Set(allAssumptions))');
code = code.replace(/\[\.\.\.new Set\(allClarifications\)\]/g, 'Array.from(new Set(allClarifications))');

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed TS Set syntax');
