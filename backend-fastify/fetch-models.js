const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
client.models.list().then(res => {
  console.log(res.data.map(m => m.id).join(', '));
}).catch(console.error);
