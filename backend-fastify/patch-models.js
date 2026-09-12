const fs = require('fs');
const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace Gemini models
code = code.replace(/gemini-1\.5-flash/g, 'gemini-3.1-flash-lite');

// In Pass 3 gap filler, change the explicit openai call to gemini-3.1-flash-lite
code = code.replace(/'openai\/gpt-oss-120b'/g, "'gemini-3.1-flash-lite'");

fs.writeFileSync(path, code, 'utf8');
console.log('Models updated to gemini-3.1-flash-lite');
