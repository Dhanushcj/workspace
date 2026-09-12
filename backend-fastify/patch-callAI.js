const fs = require('fs');

const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

const startMarker = 'async function callAI(';
const endMarker = '// ─── Pass 1: Requirement Analyzer ─────────────────────────────────────────────';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

const newCallAI = `async function callAI(client: any, prompt: string, retries = 3, modelName = 'gemini-3.5-flash', maxTokens = 8192): Promise<any> {
  console.log('[3] AI request started...');
  
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-3.5-flash to bypass Groq 8000 TPM limit
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json"
    }
  });

  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      console.log('[4] AI response received');
      let text = result.response.text() || '{}';

      // Strip markdown code blocks if AI wraps in \`\`\`json ... \`\`\` or \`\`\` ... \`\`\`
      text = text.replace(/^\\s*\`\`\`(?:json)?\\s*/i, '').replace(/\\s*\`\`\`\\s*$/i, '').trim();

      // Find the first { and last } to extract the JSON object robustly
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1) {
        throw new Error('AI response did not contain valid JSON object. Raw: ' + text.substring(0, 300));
      }

      // If it's severely truncated, endIdx might be before startIdx. We take from startIdx to end of string if so.
      const jsonText = endIdx > startIdx ? text.substring(startIdx, endIdx + 1) : text.substring(startIdx);
      
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (err: any) {
      if (i === retries - 1) {
        console.error('[AI] FINAL ATTEMPT FAILED:', err.message);
        throw err;
      }
      const waitMs = err.message?.includes('429') || err.message?.includes('503') ? 15000 : 5000;
      console.warn(\`[AI Retry] Attempt \${i + 1} failed, retrying in \${waitMs / 1000}s... Error: \${err.message}\`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
}

`;

const newCode = code.substring(0, startIndex) + newCallAI + code.substring(endIndex);
fs.writeFileSync(path, newCode, 'utf8');
console.log('Successfully replaced callAI to use Gemini instead of Groq');
