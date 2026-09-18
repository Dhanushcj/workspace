const fs = require('fs');
let data = fs.readFileSync('src/services/aiService.ts', 'utf8');

// Replace Prompt Rules
const oldRules = `3. Prefix Module names with their sequence (e.g. "1. Authentication", "2. Dashboard").
  4. Prefix Task titles with their numerical sequence based on their module (e.g., "1.1 Create User table", "1.2 Build Login UI with Email and Password fields").
  5. TASK TITLES MUST BE EXTREMELY DETAILED. For example, instead of "Create member dashboard", use "1.3 Create Member Dashboard layout with Sidebar (Home, Profile, Settings) and top navbar".
  6. The description for each task MUST be highly detailed and explain the flow and implementation steps clearly using markdown. Use bullet points and bold text where necessary to make the workflow clear.
  7. Order them by actual implementation dependencies (Database -> API -> Layout -> Components) so they can be completed in perfect order.
  8. Every task MUST contain: sequence, title (describing ONE clear action with a verb), highly detailed markdown description, why it is needed, expected result, and dependency.
  9. STRICTLY focus on application DEVELOPMENT tasks (coding UI, APIs, Database).`;

const newRules = `3. DO NOT prefix Module names or Task titles with numbers. Just provide descriptive names (e.g. "Authentication", "Create User table").
  4. TASK TITLES MUST BE EXTREMELY DETAILED. For example, instead of "Create member dashboard", use "Create Member Dashboard layout with Sidebar (Home, Profile, Settings) and top navbar".
  5. DASHBOARD SIDEBAR EXPANSION: For ANY requirement related to a 'Dashboard' or 'Portal', you MUST generate a separate User Story for EVERY SINGLE TAB that would typically exist on that dashboard's sidebar (e.g. Overview, Members, Billing, Settings, Reports, Staff). Then generate 5-10 tasks for EACH of those tabs.
  6. UI Tasks must be broken down by TAB or SECTION. E.g., "Create Overview Tab", "Create Members Tab with Data Table", "Create Employee Management Tab".
  7. The description for each task MUST be highly detailed and explain the flow and implementation steps clearly using markdown. Use bullet points and bold text where necessary to make the workflow clear.
  8. Order them by actual implementation dependencies (Database -> API -> Layout -> Components) so they can be completed in perfect order.
  9. Every task MUST contain: sequence, title (describing ONE clear action with a verb), highly detailed markdown description, why it is needed, expected result, and dependency.
  10. STRICTLY focus on application DEVELOPMENT tasks (coding UI, APIs, Database).
  11. EXHAUSTIVE GENERATION: You MUST generate at least 2-4 stories per requirement, and at least 5-10 granular tasks per story.
  12. DO NOT summarize or take shortcuts. Expand on EVERY SINGLE REQUIREMENT exhaustively. Ensure EVERY aspect is broken down into specific API, Database, and UI tasks.
  13. FEATURE EXTRAPOLATION: The customer requirements might be brief. You MUST logically infer and generate the full suite of expected standard features for that module.`;

data = data.replace(oldRules, newRules);

// Replace Numbering Logic
const oldRenumber = `  // Renumber modules sequentially
  mergedModules.forEach((m, idx) => {
    m.id = \`MOD-\${String(idx + 1).padStart(3, '0')}\`;
    m.sequence = idx + 1;
  });`;

const newRenumber = `  // Renumber modules sequentially and inject hierarchy prefixes
  mergedModules.forEach((m, idx) => {
    const modSeq = idx + 1;
    m.id = \`MOD-\${String(modSeq).padStart(3, '0')}\`;
    m.sequence = modSeq;
    
    m.name = (m.name || '').replace(/^[\\d\\.]+\\s*/, '');
    m.name = \`\${modSeq}. \${m.name}\`;

    let storyCounter = 1;
    (m.stories || []).forEach((story: any) => {
      story.title = (story.title || '').replace(/^[\\d\\.]+\\s*/, '');
      const storySeq = \`\${modSeq}.\${storyCounter++}\`;
      story.title = \`\${storySeq} \${story.title}\`;

      let taskCounter = 1;
      (story.tasks || []).forEach((task: any) => {
        task.sequence = taskCounter++;
        let rawTitle = (task.title || '').replace(/^[\\d\\.]+\\s*/, '');
        task.title = \`\${storySeq}.\${task.sequence} \${rawTitle}\`;
      });
    });
  });`;

data = data.replace(oldRenumber, newRenumber);

// Replace BATCH_SIZE
data = data.replace(/const BATCH_SIZE = 12;/g, 'const BATCH_SIZE = 2;');

fs.writeFileSync('src/services/aiService.ts', data);
console.log('Fixes applied.');
