const fs = require('fs');

const path = 'src/services/aiService.ts';
let code = fs.readFileSync(path, 'utf8');

// The function starts at async function generatePlan(
// It ends right before // ─── Pass 3: Validator / Gap Filler ──────────────────────────────────────────

const startMarker = 'async function generatePlan(';
const endMarker = '// ─── Pass 3: Validator / Gap Filler';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

const newGeneratePlan = \`async function generatePlan(
  pass1Result: any,
  sprintCapacity: number,
  existingIssueTitles: string[]
): Promise<any> {
  const client = getClient();
  const reqs = pass1Result.requirements || [];
  const BATCH_SIZE = 12; // 12 reqs per batch ensures fast generation while keeping context
  
  let mergedModules: any[] = [];
  let mergedSprints: any[] = [];
  let projectSummary = "";
  let allAssumptions: string[] = [];
  let allClarifications: string[] = [];
  
  const existingIssuesStr = existingIssueTitles.length > 0
    ? \`\\nEXISTING TASKS (already created — DO NOT duplicate these):\\n\${existingIssueTitles.map((t) => \`- \${t}\`).join('\\n')}\`
    : '\\nNo existing tasks. Generate a fresh plan.';

  console.log(\`[AI PASS 2] Generating Agile plan from \${reqs.length} requirements in batches of \${BATCH_SIZE}...\`);

  for (let i = 0; i < reqs.length; i += BATCH_SIZE) {
    const batchReqs = reqs.slice(i, i + BATCH_SIZE);
    console.log(\`[AI PASS 2] Processing batch \${Math.floor(i/BATCH_SIZE) + 1} of \${Math.ceil(reqs.length / BATCH_SIZE)} (\${batchReqs.length} requirements)...\`);
    const requirementsJson = JSON.stringify(batchReqs, null, 2);

    const prompt = \`You are a senior Agile Product Manager planning a software project for a customer.

You have a list of CUSTOMER REQUIREMENTS. Your job is to generate the development plan the team will use to BUILD THIS CUSTOMER'S PRODUCT.

⚠️ CRITICAL RULE — GRANULAR JUNIOR DEVELOPER TASKS:
1. NEVER generate broad tasks like "Create Landing Page", "Build Dashboard", or "Implement Authentication".
2. Break broad requirements into SMALL, SPECIFIC, ACTIONABLE implementation tasks (e.g. 5-10 tasks per story).
3. UI tasks MUST specify the exact component (e.g., "Add Home, About, and Contact links to the topbar").
4. DB tasks MUST be specific (e.g., "Create User table", "Add name, email, role fields").
5. Form tasks MUST be specific (e.g., "Add Email input", "Add Password input").
6. Task descriptions must answer "WHAT EXACTLY DO I NEED TO DO?".
7. Order them by actual implementation dependencies (Database -> API -> Layout -> Components).
8. Use simple, non-technical language (e.g. "Add permission checks" instead of "Implement RBAC").
9. Every task MUST contain: sequence, title (describing ONE clear action with a verb), simple description, why it is needed, expected result, and dependency.
10. STRICTLY focus on application DEVELOPMENT tasks (coding UI, APIs, Database).

CUSTOMER PROJECT OBJECTIVE: \${pass1Result.objective}
USER ROLES: \${(pass1Result.actors || []).join(', ')}

CUSTOMER REQUIREMENTS (Batch \${Math.floor(i/BATCH_SIZE) + 1}):
\${requirementsJson}

SPRINT CONFIGURATION:
- Sprint Capacity: \${sprintCapacity} story points
- Fibonacci story points ONLY: 1, 2, 3, 5, 8, 13
\${existingIssuesStr}

══════════════════════════════════════
STEP 1 — MODULES (Customer Features)
══════════════════════════════════════
Group requirements into logical CUSTOMER-FACING modules and order them by implementation sequence.

══════════════════════════════════════
STEP 2 — USER STORIES
══════════════════════════════════════
For each requirement, write one user story. "As a [role], I want [feature], so that [value]."

══════════════════════════════════════
STEP 3 — TASKS (Customer Feature Tasks)
══════════════════════════════════════
For each story, generate as many small, granular tasks as needed to fully build the feature.
Task titles must start with a verb (Create, Add, Display, Validate, Connect).

══════════════════════════════════════
STEP 4 — STORY POINT ESTIMATION
══════════════════════════════════════
Use ONLY Fibonacci values: 1, 2, 3, 5, 8, 13

══════════════════════════════════════
STEP 5 — SPRINT PLANNING
══════════════════════════════════════
Group stories into sprints:
- Max \${sprintCapacity} story points per sprint.
- DO NOT STOP GENERATING when you reach \${sprintCapacity} points! If you exceed the capacity, automatically create Sprint 2, Sprint 3, etc. until ALL stories for the complete project are planned.
- Give each sprint a descriptive name representing what is being built in that sprint (e.g., "Sprint 1: Database & Auth Setup", "Sprint 2: Student Dashboard MVP").

Return ONLY this exact JSON (no markdown, no explanation, start with {):

{
  "projectSummary": "One paragraph describing what the customer is building",
  "modules": [
    {
      "id": "MOD-001",
      "sequence": 1,
      "name": "Authentication",
      "description": "User login, role management, and access control",
      "requirementIds": ["FR-001"],
      "priority": "HIGH",
      "stories": [
        {
          "id": "ST-001",
          "sequence": 1,
          "title": "User Login",
          "userStory": "As a user, I want to log in with my credentials, so that I can access my role dashboard.",
          "description": "Login screen with email/password",
          "requirementIds": ["FR-001"],
          "storyPoints": 5,
          "estimateReason": "Involves login form, validation — 5 points.",
          "needsSplit": false,
          "priority": "HIGH",
          "acceptanceCriteria": ["User can enter email"],
          "dependencies": [],
          "tasks": [
            {
              "id": "TASK-001",
              "sequence": 1,
              "title": "Create Login Database Structure",
              "description": "Create the User table.",
              "why": "The system needs user information before users can log in.",
              "expectedResult": "User login information can be stored.",
              "dependency": "None",
              "category": "BACKEND",
              "requirementIds": ["FR-001"],
              "storyPoints": 2,
              "estimateReason": "Standard table structure — 2 points.",
              "priority": "HIGH"
            }
          ]
        }
      ]
    }
  ],
  "sprints": [
    {
      "id": "SPRINT-1",
      "name": "Sprint 1: Database & Auth Setup",
      "goal": "Basic user authentication and database setup",
      "storyIds": ["ST-001"],
      "totalStoryPoints": 5
    }
  ],
  "assumptions": ["Assumption 1"],
  "clarifications": ["Unclear point needing client decision"]
}

⚠️ FINAL CRITICAL RULES:
- Every module, story, and task MUST trace to a requirement ID from: \${batchReqs.map((r: any) => r.id).join(', ')}
- Return ONLY the JSON. No markdown. Start with {.
\`;

    try {
      const result = await callAI(client, prompt);
      
      if (!projectSummary && result.projectSummary) {
        projectSummary = result.projectSummary;
      }
      
      if (result.assumptions) allAssumptions = [...allAssumptions, ...result.assumptions];
      if (result.clarifications) allClarifications = [...allClarifications, ...result.clarifications];

      // Merge modules
      for (const mod of (result.modules || [])) {
        const existing = mergedModules.find(m => m.name === mod.name);
        if (existing) {
          existing.stories = [...(existing.stories || []), ...(mod.stories || [])];
          existing.requirementIds = [...new Set([...(existing.requirementIds || []), ...(mod.requirementIds || [])])];
        } else {
          mergedModules.push(mod);
        }
      }

      // Collect sprints
      if (result.sprints) {
        mergedSprints = [...mergedSprints, ...result.sprints];
      }
    } catch (err: any) {
      console.error(\`[AI PASS 2] Batch \${Math.floor(i/BATCH_SIZE) + 1} failed: \${err.message}\`);
      // continue to next batch instead of failing the whole thing
    }
  }

  // Renumber modules sequentially
  mergedModules.forEach((m, idx) => {
    m.id = \`MOD-\${String(idx + 1).padStart(3, '0')}\`;
    m.sequence = idx + 1;
  });

  // Renumber sprints sequentially
  mergedSprints.forEach((s, idx) => {
    s.id = \`SPRINT-\${idx + 1}\`;
    // ensure name is descriptive
    if (!s.name || s.name === \`Sprint \${idx + 1}\`) {
      s.name = \`Sprint \${idx + 1}: Core Features\`;
    } else if (!s.name.startsWith('Sprint')) {
      s.name = \`Sprint \${idx + 1}: \${s.name}\`;
    }
  });

  return {
    projectSummary,
    modules: mergedModules,
    sprints: mergedSprints,
    assumptions: [...new Set(allAssumptions)],
    clarifications: [...new Set(allClarifications)]
  };
}

\`;

const newCode = code.substring(0, startIndex) + newGeneratePlan + code.substring(endIndex);
fs.writeFileSync(path, newCode, 'utf8');
console.log('Successfully replaced generatePlan with batching logic');
