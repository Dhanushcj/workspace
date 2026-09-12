const fs = require('fs');
const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

// The regenerateItem function (around line 633) uses Groq client. 
// It needs a valid Groq model like 'llama-3.1-8b-instant' instead of a Gemini model.
// Find the exact line in regenerateItem where it calls client.chat.completions.create
code = code.replace(/model:\s*'gemini-3\.1-flash-lite',\s*messages:\s*\[{ role: 'user', content: prompt }\]/g, "model: 'llama-3.1-8b-instant',\n      messages: [{ role: 'user', content: prompt }]");

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed Groq model in regenerateItem');
