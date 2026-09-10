import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
      console.log('Available models:');
      data.models.forEach((m: any) => console.log(m.name, m.supportedGenerationMethods));
    } else {
      console.log('Error:', data);
    }
  } catch (err: any) {
    console.error('Fetch Error:', err.message);
  }
}

listModels();
