import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
console.log('Using API Key:', apiKey.substring(0, 10) + '...');

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192
      }
    });
    
    console.log('Sending request to Gemini...');
    const result = await model.generateContent("Test prompt. Respond with a JSON object { \"success\": true }");
    console.log('Result:', result.response.text());
  } catch (err: any) {
    console.error('Gemini Error:', err.message);
  }
}

testGemini();
