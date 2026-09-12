const fs = require('fs');
const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace gemini-3.5-flash with gemini-1.5-flash
code = code.replace(/gemini-3\.5-flash/g, 'gemini-1.5-flash');

// Now inject the ID sanitization at the end of analyzeRequirements
const targetReturnStr = '    // Build final merged response\n    return {\n      projectSummary: pass2Result.projectSummary';

const sanitizationStr = `    // Final ID sanitization to prevent React Duplicate Key errors
    let modCounter = 1;
    let storyCounter = 1;
    let taskCounter = 1;
    
    (validatedPlan.modules || []).forEach((mod: any) => {
      mod.id = \`MOD-\${String(modCounter++).padStart(3, '0')}\`;
      (mod.stories || []).forEach((story: any) => {
        story.id = \`ST-\${String(storyCounter++).padStart(3, '0')}\`;
        (story.tasks || []).forEach((task: any) => {
          task.id = \`TASK-\${String(taskCounter++).padStart(3, '0')}\`;
        });
      });
    });

    // Build final merged response
    return {
      projectSummary: pass2Result.projectSummary`;

code = code.replace(targetReturnStr, sanitizationStr);

fs.writeFileSync(path, code, 'utf8');
console.log('Final patch applied successfully');
