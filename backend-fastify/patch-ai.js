const fs = require('fs');
const path = './src/services/aiService.ts';

let content = fs.readFileSync(path, 'utf8');
if (content.includes('suggestProjectPlan')) {
    console.log('suggestProjectPlan already exists.');
    process.exit(0);
}

// Remove the final "};" and replace it with our new method + "};"
content = content.replace(/};\s*$/, `
  ,
  /**
   * Generates a high-level suggestion of features, topics, and layout for user confirmation.
   *
   * @param rawRequirements  Full requirement text from the user
   * @returns                A markdown string with the suggested overview
   */
  async suggestProjectPlan(rawRequirements: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const client = new GoogleGenerativeAI(apiKey);
    
    const prompt = \`You are a Senior Technical Architect and Product Manager.
The customer has provided the following requirements for a software project.

CUSTOMER REQUIREMENTS:
"""
\${rawRequirements}
"""

Analyze these requirements and suggest an extremely detailed and complete project structure.
Your response MUST be in formatted Markdown.

Include the following sections in a highly structured flow:
1. **Project Topics & Overview**: A summary of the core objective and what the product aims to achieve.
2. **Roles & Actors**: The exact types of users who will use the system, and what they can do.
3. **Features & Modules to Build**: A detailed breakdown of EVERY single feature required. Break this down logically. Example: "Admin Dashboard -> Overview Tab, Settings Tab -> Functions needed in settings...". DO NOT skip any modules.
4. **Sidebar / Navigation Layout**: A complete list of all recommended sidebar tabs, navigation links, and the sub-pages within them for the application layout.
5. **Implementation Orderflow**: Suggest a clean, step-by-step sequential order of what should be built first to last (e.g., 1. Database schema, 2. Auth, 3. Landing Page, etc.).

CRITICAL: Do NOT summarize broadly. Be exhaustively detailed. List every single tab, page, and feature so the user can perfectly visualize what is going to be built before they confirm and generate tasks.\`;

    const model = client.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 8192,
      }
    });

    for (let i = 0; i < 3; i++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text() || 'No suggestion generated.';
      } catch (err: any) {
        if (i === 2) {
          console.error('[AI SUGGEST] FAILED:', err.message);
          require('fs').appendFileSync('ai-error.log', new Date().toISOString() + ' [AI SUGGEST ERROR]: ' + err.stack + '\\n');
          throw new Error('Failed to generate project suggestion: ' + err.message);
        }
        const waitMs = err.message?.includes('503') || err.message?.includes('429') ? 10000 : 3000;
        console.warn(\`[AI SUGGEST Retry] Attempt \${i + 1} failed, retrying in \${waitMs / 1000}s... Error: \${err.message}\`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }
    throw new Error('Failed to generate project suggestion.');
  }
};
`);

fs.writeFileSync(path, content, 'utf8');
console.log('Appended suggestProjectPlan successfully.');
