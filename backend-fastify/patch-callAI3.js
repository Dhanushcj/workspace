const fs = require('fs');
const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

const startMarker = 'async function callAI(client: Groq';
const endMarker = '// ─── Pass 1: Requirement Analyzer';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

const newCallAI = "async function callAI(client: any, prompt: string, retries = 3, modelName = 'gemini-3.5-flash', maxTokens = 8192): Promise<any> {\n" +
"  console.log('[3] AI request started...');\n" +
"  const { GoogleGenerativeAI } = require('@google/generative-ai');\n" +
"  const apiKey = process.env.GEMINI_API_KEY;\n" +
"  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');\n" +
"  const genAI = new GoogleGenerativeAI(apiKey);\n" +
"  const model = genAI.getGenerativeModel({\n" +
"    model: 'gemini-3.5-flash',\n" +
"    generationConfig: {\n" +
"      temperature: 0.3,\n" +
"      maxOutputTokens: maxTokens,\n" +
"      responseMimeType: 'application/json'\n" +
"    }\n" +
"  });\n" +
"  for (let i = 0; i < retries; i++) {\n" +
"    try {\n" +
"      const result = await model.generateContent(prompt);\n" +
"      console.log('[4] AI response received');\n" +
"      let text = result.response.text() || '{}';\n" +
"      text = text.replace(/^\\\\s*\\`\\`\\`(?:json)?\\\\s*/i, '').replace(/\\\\s*\\`\\`\\`\\\\s*$/i, '').trim();\n" +
"      const startIdx = text.indexOf('{');\n" +
"      const endIdx = text.lastIndexOf('}');\n" +
"      if (startIdx === -1) {\n" +
"        throw new Error('AI response did not contain valid JSON object. Raw: ' + text.substring(0, 300));\n" +
"      }\n" +
"      const jsonText = endIdx > startIdx ? text.substring(startIdx, endIdx + 1) : text.substring(startIdx);\n" +
"      try {\n" +
"        const repairedJsonText = require('jsonrepair').jsonrepair(jsonText);\n" +
"        return JSON.parse(repairedJsonText);\n" +
"      } catch (repairErr) {\n" +
"        throw new Error('JSON Repair failed: ' + repairErr.message);\n" +
"      }\n" +
"    } catch (error) {\n" +
"      if (i === retries - 1) throw error;\n" +
"      const waitMs = error.message?.includes('429') ? 15000 : 3000;\n" +
"      console.warn('[AI Retry] Attempt ' + (i + 1) + ' failed, retrying in ' + (waitMs / 1000) + 's... Error: ' + error.message);\n" +
"      await new Promise(resolve => setTimeout(resolve, waitMs));\n" +
"    }\n" +
"  }\n" +
"}\n\n";

const newCode = code.substring(0, startIndex) + newCallAI + code.substring(endIndex);
fs.writeFileSync(path, newCode, 'utf8');
console.log('Successfully replaced callAI');
