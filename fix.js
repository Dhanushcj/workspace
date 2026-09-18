const fs = require('fs');
let data = fs.readFileSync('backend-fastify/src/services/aiService.ts', 'utf8');

const regex1 = /\/\/[^\n]*Pass 1: Requirement Analyzer[^\n]*\n* {2}const prompt = `/;
const replacement1 = `// =========================================
// Pass 1: Requirement Analyzer
// =========================================

export async function extractRequirements(client: any, rawRequirements: string) {
  const prompt = \``;

data = data.replace(regex1, replacement1);

const regex2 = /markdown\.\\\`; type must be one of:[\s\S]*?markdown\.`;/g;
const replacement2 = `markdown.\`;`;
data = data.replace(regex2, replacement2);

fs.writeFileSync('backend-fastify/src/services/aiService.ts', data);
