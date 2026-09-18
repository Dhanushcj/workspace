const fs = require('fs');
let data = fs.readFileSync('src/services/aiService.ts', 'utf8');

// Replace prompt rules
const oldRules = `3. Prefix Module names with their sequence (e.g. "1. Authentication", "2. Dashboard").
4. Prefix Task titles with their numerical sequence based on their module (e.g., "1.1 Create User table", "1.2 Build Login UI with Email and Password fields").
5. TASK TITLES MUST BE EXTREMELY DETAILED. For example, instead of "Create member dashboard", use "1.3 Create Member Dashboard layout with Sidebar (Home, Profile, Settings) and top navbar".`;

const newRules = `3. DO NOT prefix Module names or Task titles with numbers. Just provide descriptive names (e.g. "Authentication", "Create User table").
4. TASK TITLES MUST BE EXTREMELY DETAILED. For example, instead of "Create member dashboard", use "Create Member Dashboard layout with Sidebar (Home, Profile, Settings) and top navbar".`;

data = data.replace(oldRules, newRules);

// Add programmatic renumbering logic
const oldRenumbering = `  // Renumber modules sequentially
  mergedModules.forEach((m, idx) => {
    m.id = \`MOD-\${String(idx + 1).padStart(3, '0')}\`;
    m.sequence = idx + 1;
  });`;

const newRenumbering = `  // Programmatic Sequential Renumbering
  mergedModules.forEach((m, idx) => {
    const modSeq = idx + 1;
    m.id = \`MOD-\${String(modSeq).padStart(3, '0')}\`;
    m.sequence = modSeq;
    // Strip any leading numbers the AI might have accidentally added
    m.name = (m.name || '').replace(/^[\\d\\.]+\\s*/, '');
    m.name = \`\${modSeq}. \${m.name}\`;
    
    let taskCounter = 1;
    (m.stories || []).forEach((story: any) => {
      // Strip leading numbers from story title too
      story.title = (story.title || '').replace(/^[\\d\\.]+\\s*/, '');
      
      (story.tasks || []).forEach((task: any) => {
        task.sequence = taskCounter++;
        // Strip any leading numbers the AI might have accidentally added
        let rawTitle = (task.title || '').replace(/^[\\d\\.]+\\s*/, '');
        task.title = \`\${modSeq}.\${task.sequence} \${rawTitle}\`;
      });
    });
  });`;

data = data.replace(oldRenumbering, newRenumbering);

fs.writeFileSync('src/services/aiService.ts', data);
