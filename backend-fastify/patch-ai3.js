const fs = require('fs');

const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

const startMarker = 'async function generatePlan(';
const endMarker = '// ─── Pass 3: Validator / Gap Filler ──────────────────────────────────────────';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

const newGeneratePlan = "async function generatePlan(\n" +
"  pass1Result: any,\n" +
"  sprintCapacity: number,\n" +
"  existingIssueTitles: string[]\n" +
"): Promise<any> {\n" +
"  const client = getClient();\n" +
"  const reqs = pass1Result.requirements || [];\n" +
"  const BATCH_SIZE = 12; // Process 12 requirements at a time to ensure high coverage\n" +
"  \n" +
"  let mergedModules: any[] = [];\n" +
"  let mergedSprints: any[] = [];\n" +
"  let projectSummary = \"\";\n" +
"  let allAssumptions: string[] = [];\n" +
"  let allClarifications: string[] = [];\n" +
"  \n" +
"  const existingIssuesStr = existingIssueTitles.length > 0\n" +
"    ? \"\\nEXISTING TASKS (already created — DO NOT duplicate these):\\n\" + existingIssueTitles.map((t) => \"- \" + t).join('\\n')\n" +
"    : \"\\nNo existing tasks. Generate a fresh plan.\";\n" +
"\n" +
"  console.log(\"[AI PASS 2] Generating Agile plan from \" + reqs.length + \" requirements in batches of \" + BATCH_SIZE + \"...\");\n" +
"\n" +
"  for (let i = 0; i < reqs.length; i += BATCH_SIZE) {\n" +
"    const batchReqs = reqs.slice(i, i + BATCH_SIZE);\n" +
"    console.log(\"[AI PASS 2] Processing batch \" + (Math.floor(i/BATCH_SIZE) + 1) + \" of \" + Math.ceil(reqs.length / BATCH_SIZE) + \" (\" + batchReqs.length + \" requirements)...\");\n" +
"    const requirementsJson = JSON.stringify(batchReqs, null, 2);\n" +
"\n" +
"    const prompt = \"You are a senior Agile Product Manager planning a software project for a customer.\\n\\n\" +\n" +
"\"You have a list of CUSTOMER REQUIREMENTS. Your job is to generate the development plan the team will use to BUILD THIS CUSTOMER'S PRODUCT.\\n\\n\" +\n" +
"\"⚠️ CRITICAL RULE — GRANULAR JUNIOR DEVELOPER TASKS:\\n\" +\n" +
"\"1. NEVER generate broad tasks like 'Create Landing Page', 'Build Dashboard', or 'Implement Authentication'.\\n\" +\n" +
"\"2. Break broad requirements into SMALL, SPECIFIC, ACTIONABLE implementation tasks (e.g. 5-10 tasks per story).\\n\" +\n" +
"\"3. UI tasks MUST specify the exact component (e.g., 'Add Home, About, and Contact links to the topbar').\\n\" +\n" +
"\"4. DB tasks MUST be specific (e.g., 'Create User table', 'Add name, email, role fields').\\n\" +\n" +
"\"5. Form tasks MUST be specific (e.g., 'Add Email input', 'Add Password input').\\n\" +\n" +
"\"6. Task descriptions must answer 'WHAT EXACTLY DO I NEED TO DO?'.\\n\" +\n" +
"\"7. Order them by actual implementation dependencies (Database -> API -> Layout -> Components).\\n\" +\n" +
"\"8. Use simple, non-technical language (e.g. 'Add permission checks' instead of 'Implement RBAC').\\n\" +\n" +
"\"9. Every task MUST contain: sequence, title (describing ONE clear action with a verb), simple description, why it is needed, expected result, and dependency.\\n\" +\n" +
"\"10. STRICTLY focus on application DEVELOPMENT tasks (coding UI, APIs, Database).\\n\\n\" +\n" +
"\"CUSTOMER PROJECT OBJECTIVE: \" + pass1Result.objective + \"\\n\" +\n" +
"\"USER ROLES: \" + (pass1Result.actors || []).join(', ') + \"\\n\\n\" +\n" +
"\"CUSTOMER REQUIREMENTS (Batch \" + (Math.floor(i/BATCH_SIZE) + 1) + \"):\\n\" +\n" +
"requirementsJson + \"\\n\\n\" +\n" +
"\"SPRINT CONFIGURATION:\\n\" +\n" +
"\"- Sprint Capacity: \" + sprintCapacity + \" story points\\n\" +\n" +
"\"- Fibonacci story points ONLY: 1, 2, 3, 5, 8, 13\\n\" +\n" +
"existingIssuesStr + \"\\n\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"STEP 1 — MODULES (Customer Features)\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"Group requirements into logical CUSTOMER-FACING modules and order them by implementation sequence.\\n\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"STEP 2 — USER STORIES\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"For each requirement, write one user story. 'As a [role], I want [feature], so that [value].'\\n\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"STEP 3 — TASKS (Customer Feature Tasks)\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"For each story, generate as many small, granular tasks as needed to fully build the feature.\\n\" +\n" +
"\"Task titles must start with a verb (Create, Add, Display, Validate, Connect).\\n\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"STEP 4 — STORY POINT ESTIMATION\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"Use ONLY Fibonacci values: 1, 2, 3, 5, 8, 13\\n\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"STEP 5 — SPRINT PLANNING\\n\" +\n" +
"\"══════════════════════════════════════\\n\" +\n" +
"\"Group stories into sprints:\\n\" +\n" +
"\"- Max \" + sprintCapacity + \" story points per sprint.\\n\" +\n" +
"\"- DO NOT STOP GENERATING when you reach \" + sprintCapacity + \" points! If you exceed the capacity, automatically create Sprint 2, Sprint 3, etc. until ALL stories for the complete project are planned.\\n\" +\n" +
"\"- Give each sprint a descriptive name representing what is being built in that sprint (e.g., 'Sprint 1: Database & Auth Setup', 'Sprint 2: Student Dashboard MVP').\\n\\n\" +\n" +
"\"Return ONLY this exact JSON (no markdown, no explanation, start with {):\\n\\n\" +\n" +
"\"{\\n\" +\n" +
"\"  \\\"projectSummary\\\": \\\"One paragraph describing what the customer is building\\\",\\n\" +\n" +
"\"  \\\"modules\\\": [\\n\" +\n" +
"\"    {\\n\" +\n" +
"\"      \\\"id\\\": \\\"MOD-001\\\",\\n\" +\n" +
"\"      \\\"sequence\\\": 1,\\n\" +\n" +
"\"      \\\"name\\\": \\\"Authentication\\\",\\n\" +\n" +
"\"      \\\"description\\\": \\\"User login, role management, and access control\\\",\\n\" +\n" +
"\"      \\\"requirementIds\\\": [\\\"FR-001\\\"],\\n\" +\n" +
"\"      \\\"priority\\\": \\\"HIGH\\\",\\n\" +\n" +
"\"      \\\"stories\\\": [\\n\" +\n" +
"\"        {\\n\" +\n" +
"\"          \\\"id\\\": \\\"ST-001\\\",\\n\" +\n" +
"\"          \\\"sequence\\\": 1,\\n\" +\n" +
"\"          \\\"title\\\": \\\"User Login\\\",\\n\" +\n" +
"\"          \\\"userStory\\\": \\\"As a user, I want to log in with my credentials, so that I can access my role dashboard.\\\",\\n\" +\n" +
"\"          \\\"description\\\": \\\"Login screen with email/password\\\",\\n\" +\n" +
"\"          \\\"requirementIds\\\": [\\\"FR-001\\\"],\\n\" +\n" +
"\"          \\\"storyPoints\\\": 5,\\n\" +\n" +
"\"          \\\"estimateReason\\\": \\\"Involves login form, validation — 5 points.\\\",\\n\" +\n" +
"\"          \\\"needsSplit\\\": false,\\n\" +\n" +
"\"          \\\"priority\\\": \\\"HIGH\\\",\\n\" +\n" +
"\"          \\\"acceptanceCriteria\\\": [\\\"User can enter email\\\"],\\n\" +\n" +
"\"          \\\"dependencies\\\": [],\\n\" +\n" +
"\"          \\\"tasks\\\": [\\n\" +\n" +
"\"            {\\n\" +\n" +
"\"              \\\"id\\\": \\\"TASK-001\\\",\\n\" +\n" +
"\"              \\\"sequence\\\": 1,\\n\" +\n" +
"\"              \\\"title\\\": \\\"Create Login Database Structure\\\",\\n\" +\n" +
"\"              \\\"description\\\": \\\"Create the User table.\\\",\\n\" +\n" +
"\"              \\\"why\\\": \\\"The system needs user information before users can log in.\\\",\\n\" +\n" +
"\"              \\\"expectedResult\\\": \\\"User login information can be stored.\\\",\\n\" +\n" +
"\"              \\\"dependency\\\": \\\"None\\\",\\n\" +\n" +
"\"              \\\"category\\\": \\\"BACKEND\\\",\\n\" +\n" +
"\"              \\\"requirementIds\\\": [\\\"FR-001\\\"],\\n\" +\n" +
"\"              \\\"storyPoints\\\": 2,\\n\" +\n" +
"\"              \\\"estimateReason\\\": \\\"Standard table structure — 2 points.\\\",\\n\" +\n" +
"\"              \\\"priority\\\": \\\"HIGH\\\"\\n\" +\n" +
"\"            }\\n\" +\n" +
"\"          ]\\n\" +\n" +
"\"        }\\n\" +\n" +
"\"      ]\\n\" +\n" +
"\"    }\\n\" +\n" +
"\"  ],\\n\" +\n" +
"\"  \\\"sprints\\\": [\\n\" +\n" +
"\"    {\\n\" +\n" +
"\"      \\\"id\\\": \\\"SPRINT-1\\\",\\n\" +\n" +
"\"      \\\"name\\\": \\\"Sprint 1: Database & Auth Setup\\\",\\n\" +\n" +
"\"      \\\"goal\\\": \\\"Basic user authentication and database setup\\\",\\n\" +\n" +
"\"      \\\"storyIds\\\": [\\\"ST-001\\\"],\\n\" +\n" +
"\"      \\\"totalStoryPoints\\\": 5\\n\" +\n" +
"\"    }\\n\" +\n" +
"\"  ],\\n\" +\n" +
"\"  \\\"assumptions\\\": [\\\"Assumption 1\\\"],\\n\" +\n" +
"\"  \\\"clarifications\\\": [\\\"Unclear point needing client decision\\\"]\\n\" +\n" +
"\"}\\n\\n\" +\n" +
"\"⚠️ FINAL CRITICAL RULES:\\n\" +\n" +
"\"- Every module, story, and task MUST trace to a requirement ID from: \" + batchReqs.map((r: any) => r.id).join(', ') + \"\\n\" +\n" +
"\"- Return ONLY the JSON. No markdown. Start with {.\\n\";\n" +
"\n" +
"    try {\n" +
"      const result = await callAI(client, prompt);\n" +
"      \n" +
"      if (!projectSummary && result.projectSummary) {\n" +
"        projectSummary = result.projectSummary;\n" +
"      }\n" +
"      \n" +
"      if (result.assumptions) allAssumptions = [...allAssumptions, ...result.assumptions];\n" +
"      if (result.clarifications) allClarifications = [...allClarifications, ...result.clarifications];\n" +
"\n" +
"      // Merge modules\n" +
"      for (const mod of (result.modules || [])) {\n" +
"        const existing = mergedModules.find(m => m.name === mod.name);\n" +
"        if (existing) {\n" +
"          existing.stories = [...(existing.stories || []), ...(mod.stories || [])];\n" +
"          existing.requirementIds = [...new Set([...(existing.requirementIds || []), ...(mod.requirementIds || [])])];\n" +
"        } else {\n" +
"          mergedModules.push(mod);\n" +
"        }\n" +
"      }\n" +
"\n" +
"      // Collect sprints\n" +
"      if (result.sprints) {\n" +
"        mergedSprints = [...mergedSprints, ...result.sprints];\n" +
"      }\n" +
"    } catch (err: any) {\n" +
"      console.error(\"[AI PASS 2] Batch \" + (Math.floor(i/BATCH_SIZE) + 1) + \" failed: \" + err.message);\n" +
"    }\n" +
"  }\n" +
"\n" +
"  // Renumber modules sequentially\n" +
"  mergedModules.forEach((m, idx) => {\n" +
"    m.id = \"MOD-\" + String(idx + 1).padStart(3, '0');\n" +
"    m.sequence = idx + 1;\n" +
"  });\n" +
"\n" +
"  // Renumber sprints sequentially\n" +
"  mergedSprints.forEach((s, idx) => {\n" +
"    s.id = \"SPRINT-\" + (idx + 1);\n" +
"    if (!s.name || s.name === \"Sprint \" + (idx + 1)) {\n" +
"      s.name = \"Sprint \" + (idx + 1) + \": Core Features\";\n" +
"    } else if (!s.name.startsWith('Sprint')) {\n" +
"      s.name = \"Sprint \" + (idx + 1) + \": \" + s.name;\n" +
"    }\n" +
"  });\n" +
"\n" +
"  return {\n" +
"    projectSummary,\n" +
"    modules: mergedModules,\n" +
"    sprints: mergedSprints,\n" +
"    assumptions: [...new Set(allAssumptions)],\n" +
"    clarifications: [...new Set(allClarifications)]\n" +
"  };\n" +
"}\n\n";

const newCode = code.substring(0, startIndex) + newGeneratePlan + code.substring(endIndex);
fs.writeFileSync(path, newCode, 'utf8');
console.log('Successfully replaced generatePlan with batching logic');
