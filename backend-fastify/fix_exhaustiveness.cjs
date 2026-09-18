const fs = require('fs');
let data = fs.readFileSync('src/services/aiService.ts', 'utf8');

// Update Pass 1 Rules
const newPass1Rule = `7. Extract ALL requirements — do not merge distinct features. Break down large features into smaller, specific requirements (aim for 15-30 granular FRs for a typical project).
8. Return ONLY the JSON object. No explanations. No markdown.\`;`;

data = data.replace(
  /7\. Extract ALL requirements — do not merge distinct features\.\n8\. Return ONLY the JSON object\. No explanations\. No markdown\.\`;/g, 
  newPass1Rule
);

data = data.replace(
  /7\. Extract ALL requirements \?" do not merge distinct features\.\n8\. Return ONLY the JSON object\. No explanations\. No markdown\.\`;/g, 
  newPass1Rule
);

// Update BATCH_SIZE in Pass 2
data = data.replace(/const BATCH_SIZE = 12;/g, 'const BATCH_SIZE = 3;');

// Update Pass 2 Prompt Rules
const pass2RulesTarget = `9. STRICTLY focus on application DEVELOPMENT tasks (coding UI, APIs, Database).`;
const pass2RulesNew = `9. STRICTLY focus on application DEVELOPMENT tasks (coding UI, APIs, Database).
10. EXHAUSTIVE GENERATION: You MUST generate at least 2-4 stories per requirement, and at least 5-10 granular tasks per story.
11. DO NOT summarize or take shortcuts. Expand on EVERY SINGLE REQUIREMENT exhaustively. Ensure EVERY aspect is broken down into specific API, Database, and UI tasks.`;

data = data.replace(pass2RulesTarget, pass2RulesNew);

fs.writeFileSync('src/services/aiService.ts', data);
