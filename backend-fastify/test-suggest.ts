import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = client.getGenerativeModel({
  model: 'gemini-3.5-flash',
  generationConfig: {
    temperature: 0.5,
    maxOutputTokens: 8192,
  }
});

const prompt = `You are a Senior Technical Architect and Product Manager.
The customer has provided the following requirements for a software project.

CUSTOMER REQUIREMENTS:
"""
A multi-tenant, cloud-based College ERP SaaS Platform designed to centralize and automate academic, administrative, financial, and communication workflows for higher education institutions, supporting multiple user roles including Super Admins, College Admins, Academic/Non-Academic Staff, Students, and Parents.
"""

Analyze these requirements and suggest an extremely detailed and complete project structure.
Your response MUST be in formatted Markdown.

Include the following sections in a highly structured flow:
1. **Project Topics & Overview**: A summary of the core objective and what the product aims to achieve.
2. **Roles & Actors**: The exact types of users who will use the system, and what they can do.
3. **Features & Modules to Build**: A detailed breakdown of every feature required. Break this down logically. Example: "Admin Dashboard -> Overview Tab, Settings Tab -> Functions needed in settings..."
4. **Sidebar / Navigation Layout**: A complete list of all recommended sidebar tabs, navigation links, and the sub-pages within them for the application layout.
5. **Implementation Orderflow**: Suggest a clean, step-by-step sequential order of what should be built first to last (e.g., 1. Database schema, 2. Auth, 3. Landing Page, etc.).

Keep it highly detailed so the user can perfectly visualize what is going to be built before they confirm and generate tasks.`;

model.generateContent(prompt).then(res => {
  console.log('Success:', res.response.text().substring(0, 100));
}).catch(err => {
  console.log('Error:', err.message);
});
