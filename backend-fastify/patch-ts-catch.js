const fs = require('fs');
const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/catch \(repairErr\)/g, 'catch (repairErr: any)');
code = code.replace(/catch \(error\)/g, 'catch (error: any)');

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed TS unknown error types');
