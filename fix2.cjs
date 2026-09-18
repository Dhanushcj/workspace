const fs = require('fs');
let lines = fs.readFileSync('backend-fastify/src/services/aiService.ts', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Pass 1: Requirement Analyzer') && lines[i].includes('const prompt')) {
    lines[i] = '// =========================================\n// Pass 1: Requirement Analyzer\n// =========================================\n\nexport async function extractRequirements(client: any, rawRequirements: string) {\n  const prompt = `You are an Expert Technical Product Manager and Systems Architect for a software development agency.';
  }
  
  if (lines[i].includes('markdown.\\`; type must be one of:')) {
    lines[i] = '8. Return ONLY the JSON object. No explanations. No markdown.`;\n';
    lines[i+1] = '';
    lines[i+2] = '';
    lines[i+3] = '';
  }
}

fs.writeFileSync('backend-fastify/src/services/aiService.ts', lines.join('\n'));
