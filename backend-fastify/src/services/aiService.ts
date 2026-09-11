/**
 * aiService.ts
 *
 * 3-Pass AI Architecture for Agile Project Planning:
 *
 *  Pass 1 — Requirement Analyzer
 *    Input:  Raw project requirements text
 *    Output: Structured requirements (FR-001..N), actors, assumptions, clarifications
 *
 *  Pass 2 — Agile Planner
 *    Input:  Structured requirements from Pass 1 + sprint config + existing issues
 *    Output: Modules → Stories → Tasks (all with requirementIds), Fibonacci points,
 *            dependency analysis, sprint plan
 *
 *  Pass 3 — Validator / Coverage Checker
 *    Input:  Plan from Pass 2 + original requirements
 *    Output: Coverage report, unrelated item detection, oversized story flags,
 *            corrected plan with any gaps filled
 */

import Groq from 'groq-sdk';
import process from 'process';
import { jsonrepair } from 'jsonrepair';
import { validateAndRepairPlan, checkRequirementCoverage } from './aiValidator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClient() {
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured in backend environment variables.');
  return new Groq({ apiKey });
}

async function callAI(client: Groq, prompt: string, retries = 3, model = 'openai/gpt-oss-120b', maxTokens = 8192): Promise<any> {
  console.log('[3] AI request started...');
  for (let i = 0; i < retries; i++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      });
      console.log('[4] AI response received');
      let text = completion.choices[0]?.message?.content || '{}';

      // Strip markdown code blocks if AI wraps in ```json ... ``` or ``` ... ```
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      // Find the first { and last } to extract the JSON object robustly
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1) {
        throw new Error('AI response did not contain valid JSON object. Raw: ' + text.substring(0, 300));
      }

      // If it's severely truncated, endIdx might be before startIdx. We take from startIdx to end of string if so.
      const jsonText = endIdx > startIdx ? text.substring(startIdx, endIdx + 1) : text.substring(startIdx);
      
      try {
        const repairedJsonText = jsonrepair(jsonText);
        return JSON.parse(repairedJsonText);
      } catch (repairErr: any) {
        throw new Error('JSON Repair failed: ' + repairErr.message);
      }
    } catch (error: any) {
      if (i === retries - 1) throw error;
      // For rate limit errors (429), wait longer to let the TPM window reset
      const isRateLimit = error.message?.includes('429') || error.message?.includes('rate_limit');
      const waitMs = isRateLimit ? 15000 : 3000;
      console.warn(`[AI Retry] Attempt ${i + 1} failed, retrying in ${waitMs / 1000}s... Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
}

// ─── Pass 1: Requirement Analyzer ────────────────────────────────────────────

async function extractRequirements(rawRequirements: string): Promise<any> {
  const client = getClient();

  const prompt = `You are an expert Business Analyst for a software development agency.

Your ONLY job is to read the customer's project requirements and extract the list of features and user roles.
Do NOT generate tasks, modules, stories, or sprint plans in this step.

CUSTOMER PROJECT REQUIREMENTS:
"""
${rawRequirements}
"""

Extract the following and return as strict JSON (no markdown, no code blocks, start with {):

{
  "objective": "One sentence describing what the customer wants to build",
  "actors": ["Role1", "Role2"],
  "requirements": [
    {
      "id": "FR-001",
      "title": "Short feature title (e.g. Student Login, Attendance Management)",
      "description": "One to two sentence description of the feature from the customer perspective",
      "priority": "HIGH",
      "type": "FUNCTIONAL"
    }
  ],
  "nonFunctionalRequirements": [
    {
      "id": "NFR-001",
      "title": "Performance",
      "description": "Page load under 2 seconds"
    }
  ],
  "assumptions": ["Assumption 1"],
  "clarifications": ["What is unclear or needs a client decision?"],
  "securityRequirements": ["Role-based access control is required"]
}

RULES:
1. Every distinct customer feature, role, screen, or operation must become a separate requirement.
2. IDs must be sequential: FR-001, FR-002, FR-003, etc.
3. Titles must describe CUSTOMER FEATURES — e.g. "Student Login", "View Timetable", "Manage Fees". NOT internal implementation like "Database Schema", "API Layer", "JSON Parser".
4. Do NOT invent requirements not in the text.
5. type must be one of: FUNCTIONAL, NON_FUNCTIONAL, SECURITY, TECHNICAL
6. priority must be one of: HIGH, MEDIUM, LOW
7. Extract ALL requirements — do not merge distinct features.
8. Return ONLY the JSON object. No explanations. No markdown.`;

  return callAI(client, prompt);
}

// ─── Pass 2: Agile Planner ────────────────────────────────────────────────────

async function generatePlan(
  pass1Result: any,
  sprintCapacity: number,
  existingIssueTitles: string[]
): Promise<any> {
  const client = getClient();

  const requirementsJson = JSON.stringify(pass1Result.requirements, null, 2);
  const existingIssuesStr = existingIssueTitles.length > 0
    ? `\nEXISTING TASKS (already created — DO NOT duplicate these):\n${existingIssueTitles.map((t) => `- ${t}`).join('\n')}`
    : '\nNo existing tasks. Generate a fresh plan.';

  const prompt = `You are a senior Agile Product Manager planning a software project for a customer.

You have a list of CUSTOMER REQUIREMENTS. Your job is to generate the development plan the team will use to BUILD THIS CUSTOMER'S PRODUCT.

⚠️ CRITICAL RULE — GRANULAR JUNIOR DEVELOPER TASKS:
1. NEVER generate broad tasks like "Create Landing Page", "Build Dashboard", or "Implement Authentication".
2. Break broad requirements into SMALL, SPECIFIC, ACTIONABLE implementation tasks (e.g. 10-20 tasks per story).
3. UI tasks MUST specify the exact component (e.g., "Add Home, About, and Contact links to the topbar", "Create the Hero Section").
4. DB tasks MUST be specific (e.g., "Create User table", "Add name, email, role fields").
5. Form tasks MUST be specific (e.g., "Add Email input", "Add Password input", "Add required-field validation").
6. Task descriptions must answer "WHAT EXACTLY DO I NEED TO DO?".
7. Do NOT simply sort tasks alphabetically or by module name. Order them by actual implementation dependencies (Database -> API -> Layout -> Components).
8. Use simple, non-technical language (e.g. "Add permission checks" instead of "Implement RBAC").
9. Every task MUST contain: sequence, title (describing ONE clear action with a verb), simple description, why it is needed, expected result, and dependency.
10. Do NOT invent UI details (like Pricing or Testimonials) unless explicitly requested.

CUSTOMER PROJECT OBJECTIVE: ${pass1Result.objective}
USER ROLES: ${(pass1Result.actors || []).join(', ')}

CUSTOMER REQUIREMENTS:
${requirementsJson}

SPRINT CONFIGURATION:
- Sprint Capacity: ${sprintCapacity} story points
- Fibonacci story points ONLY: 1, 2, 3, 5, 8, 13
${existingIssuesStr}

══════════════════════════════════════
STEP 1 — MODULES (Customer Features)
══════════════════════════════════════
Group requirements into logical CUSTOMER-FACING modules and order them by implementation sequence (e.g., Authentication first, then dependent modules).
Good module names: Authentication, Student Management, Course Management.

══════════════════════════════════════
STEP 2 — USER STORIES
══════════════════════════════════════
For each requirement, write one user story. Order stories logically based on dependencies (e.g., cannot view reports before creating data).
"As a [role], I want [feature], so that [value]."
Provide 3-5 simple, testable acceptance criteria.
If a story is too large (e.g. "Complete Student Management"), split it.

══════════════════════════════════════
STEP 3 — TASKS (Customer Feature Tasks)
══════════════════════════════════════
For each story, generate as many small, granular tasks as needed to fully build the feature (often 5-15 tasks per story).
Task titles must start with a verb (Create, Add, Display, Validate, Connect).
Tasks must be sequentially ordered (sequence: 1, 2, 3...) based on actual development dependencies.

Each task must have:
- sequence: Recommended implementation order across the entire project (1 to N).
- why: Why is this task required?
- expectedResult: What should happen when it is completed?
- dependency: What needs to exist before this task can be completed (e.g. "None", "TASK-001").

══════════════════════════════════════
STEP 4 — STORY POINT ESTIMATION
══════════════════════════════════════
Use ONLY Fibonacci values: 1, 2, 3, 5, 8, 13
Assign story points based on actual complexity. Granular tasks should mostly be 1 or 2 points.

══════════════════════════════════════
STEP 5 — SPRINT PLANNING
══════════════════════════════════════
Group stories into sprints:
- Max ${sprintCapacity} story points per sprint.
- Use logical progression based on dependencies.

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
          "description": "Login screen with email/password, role-based redirect after login",
          "requirementIds": ["FR-001"],
          "storyPoints": 5,
          "estimateReason": "Involves login form, validation, role-based redirect, and auth integration — 5 points.",
          "needsSplit": false,
          "priority": "HIGH",
          "acceptanceCriteria": [
            "User can enter email and password",
            "Invalid credentials show an error message"
          ],
          "dependencies": [],
          "tasks": [
            {
              "id": "TASK-001",
              "sequence": 1,
              "title": "Create Login Database Structure",
              "description": "Create the User table and add fields for email and password.",
              "why": "The system needs user information before users can log in.",
              "expectedResult": "User login information can be stored in the database.",
              "dependency": "None",
              "category": "DATABASE",
              "requirementIds": ["FR-001"],
              "storyPoints": 2,
              "estimateReason": "Standard table structure — 2 points.",
              "priority": "HIGH"
            },
            {
              "id": "TASK-002",
              "sequence": 2,
              "title": "Create Login API",
              "description": "Create an API that checks the user's email and password.",
              "why": "The frontend needs a backend service to authenticate users.",
              "expectedResult": "A successful login response is returned when details are correct.",
              "dependency": "TASK-001",
              "category": "API",
              "requirementIds": ["FR-001"],
              "storyPoints": 3,
              "estimateReason": "Simple authentication API — 3 points.",
              "priority": "HIGH"
            },
            {
              "id": "TASK-003",
              "sequence": 3,
              "title": "Create Login Page Layout",
              "description": "Set up the main container for the login screen.",
              "why": "We need a structure to place the inputs.",
              "expectedResult": "An empty login screen container is visible.",
              "dependency": "None",
              "category": "FRONTEND",
              "requirementIds": ["FR-001"],
              "storyPoints": 1,
              "estimateReason": "Basic layout — 1 point.",
              "priority": "HIGH"
            },
            {
              "id": "TASK-004",
              "sequence": 4,
              "title": "Add Email Input",
              "description": "Add an email text field to the login layout.",
              "why": "User must input their email.",
              "expectedResult": "Email input field is visible.",
              "dependency": "TASK-003",
              "category": "FRONTEND",
              "requirementIds": ["FR-001"],
              "storyPoints": 1,
              "estimateReason": "Basic input — 1 point.",
              "priority": "HIGH"
            }
          ]
        }
      ]
    }
  ],
  "sprints": [
    {
      "id": "sprint-1",
      "name": "Sprint 1",
      "goal": "Authentication and core dashboards",
      "storyIds": ["ST-001"],
      "totalStoryPoints": 5
    }
  ],
  "assumptions": ["Assumption 1"],
  "clarifications": ["Unclear point needing client decision"]
}

⚠️ FINAL CRITICAL RULES:
- Every module, story, and task MUST trace to a requirement ID from: ${(pass1Result.requirements || []).map((r: any) => r.id).join(', ')}
- Story points MUST be: 1, 2, 3, 5, 8, or 13. No other values.
- Task names MUST describe SMALL, ACTIONABLE customer product features in simple, non-technical language.
- ALL dependencies MUST be logically ordered so a Junior Developer can follow them from 1 to N.
- Do NOT generate modules/features not in the requirements.
- Do NOT duplicate: ${existingIssueTitles.slice(0, 15).join('; ')}
- Sprints must not exceed ${sprintCapacity} story points.
- Return ONLY the JSON. No markdown. Start with {.`;

  return callAI(client, prompt);
}

// ─── Pass 3: Validator / Gap Filler ──────────────────────────────────────────

async function validateAndFillGaps(
  plan: any,
  requirements: any[],
  sprintCapacity: number
): Promise<any> {
  const client = getClient();

  // Run static coverage check first
  const coverage = checkRequirementCoverage(requirements, plan.modules || []);

  if (coverage.missing.length === 0 && coverage.unrelatedModules.length === 0) {
    // Plan is complete — no AI call needed for gap filling
    plan.validation = {
      requirementCoverage: coverage.coveragePercent,
      unrelatedItems: [],
      duplicates: [],
      invalidStoryPoints: [],
      oversizedStories: []
    };
    return plan;
  }

  // Only call AI if there are gaps or unrelated items to fix
  const missingReqs = requirements.filter(r => coverage.missing.includes(r.id));
  const prompt = `You are a senior Agile coach reviewing a customer software project plan.

The following customer requirements have NO tasks planned yet. Generate ONLY the missing modules and tasks for them.

⚠️ CRITICAL: You are filling gaps in a CUSTOMER PROJECT plan for a JUNIOR DEVELOPER.
- NEVER generate broad tasks like "Create Page" or "Implement Feature". Break every feature into SMALL, SPECIFIC, ACTIONABLE tasks.
- UI tasks MUST specify the exact component (e.g., "Add Email input", "Create the Hero Section", "Add navigation links to the topbar").
- DB tasks MUST be specific (e.g., "Create User table", "Add name, email, role, status fields").
- Form tasks MUST be specific (e.g., "Add Email input", "Add Password input", "Add required-field validation").
- Every task MUST contain: sequence, title (with an action verb), simple description, why it is needed, expected result, and dependency.
- A single task should represent ONE clear action only.
- Do NOT invent features not mentioned in the requirements.

MISSING REQUIREMENTS (generate tasks for these):
${JSON.stringify(missingReqs, null, 2)}

UNRELATED MODULES (may not be needed — flag for removal if not in requirements):
${coverage.unrelatedModules.join(', ') || 'None'}

EXISTING MODULES (do not repeat):
${(plan.modules || []).map((m: any) => m.name).join(', ')}

SPRINT CAPACITY: ${sprintCapacity} points

Return ONLY JSON (start with {):
{
  "additionalModules": [
    {
      "id": "MOD-NEW-001",
      "sequence": 99,
      "name": "Customer Module Name (e.g. Reports, Notifications)",
      "description": "Description",
      "requirementIds": ["FR-XXX"],
      "priority": "MEDIUM",
      "stories": [
        {
          "id": "ST-NEW-001",
          "sequence": 99,
          "title": "Story title",
          "userStory": "As a [role], I want [feature], so that [value].",
          "description": "Brief description",
          "requirementIds": ["FR-XXX"],
          "storyPoints": 3,
          "estimateReason": "Simple feature — 3 points.",
          "needsSplit": false,
          "priority": "MEDIUM",
          "acceptanceCriteria": ["Criterion 1"],
          "dependencies": [],
          "tasks": [
            {
              "id": "TASK-NEW-001",
              "sequence": 99,
              "title": "Create [Feature] Database Table",
              "description": "Create the database table needed for this feature.",
              "why": "We need to store this data before showing it to the user.",
              "expectedResult": "Data can be stored in the database.",
              "dependency": "None",
              "category": "DATABASE",
              "requirementIds": ["FR-XXX"],
              "storyPoints": 1,
              "estimateReason": "Standard table — 1 point.",
              "priority": "MEDIUM"
            },
            {
              "id": "TASK-NEW-002",
              "sequence": 100,
              "title": "Create [Feature] API",
              "description": "Create the API endpoint to add/update [feature] data.",
              "why": "The frontend needs a backend service to manage this data.",
              "expectedResult": "Data can be submitted and retrieved via the API.",
              "dependency": "TASK-NEW-001",
              "category": "API",
              "requirementIds": ["FR-XXX"],
              "storyPoints": 2,
              "estimateReason": "Standard API — 2 points.",
              "priority": "MEDIUM"
            }
          ]
        }
      ]
    }
  ],
  "removedModuleNames": []
}

Use Fibonacci points only: 1, 2, 3, 5, 8, 13.
Return ONLY the JSON. No markdown.`;

  let gapResult: any = { additionalModules: [], removedModuleNames: [] };
  try {
    // Use openai/gpt-oss-120b for gap fill — same model, consistent
    gapResult = await callAI(client, prompt, 3, 'openai/gpt-oss-120b', 4096);
  } catch (err) {
    // Gap filling is best-effort — if it fails, continue with what we have
    console.error('[AI VALIDATOR] Gap-fill AI call failed:', (err as Error).message);
  }

  // Merge additional modules into the plan
  if (Array.isArray(gapResult.additionalModules) && gapResult.additionalModules.length > 0) {
    plan.modules = [...(plan.modules || []), ...gapResult.additionalModules];
  }

  // Remove flagged unrelated modules
  if (Array.isArray(gapResult.removedModuleNames) && gapResult.removedModuleNames.length > 0) {
    plan.modules = (plan.modules || []).filter(
      (m: any) => !gapResult.removedModuleNames.includes(m.name)
    );
  }

  // Re-run coverage check after gap fill
  const finalCoverage = checkRequirementCoverage(requirements, plan.modules || []);

  plan.validation = {
    requirementCoverage: finalCoverage.coveragePercent,
    unrelatedItems: finalCoverage.unrelatedModules,
    duplicates: [],
    invalidStoryPoints: [],
    oversizedStories: []
  };

  return plan;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const aiService = {

  /**
   * Main 3-pass analysis pipeline.
   *
   * @param rawRequirements  Full requirement text from the Team Lead
   * @param sprintCapacity   Max story points per sprint
   * @param existingIssues   Existing issue titles in the project (for duplicate detection)
   * @returns                Complete validated plan ready to save
   */
  async analyzeRequirements(
    rawRequirements: string,
    sprintCapacity: number = 40,
    existingIssues: { _id: string; title: string }[] = []
  ): Promise<any> {
    console.log(`\n[AI PLANNER] ═══════════════════════════════════════`);
    console.log(`[AI PLANNER] Original requirements received: ${rawRequirements.length} characters`);
    console.log(`[AI PLANNER] Sprint capacity: ${sprintCapacity} points`);
    console.log(`[AI PLANNER] Existing issues to check: ${existingIssues.length}`);

    // ── Pass 1: Extract requirements ──────────────────────────────────────────
    console.log(`\n[AI PASS 1] Extracting structured requirements...`);
    let pass1Result: any;
    try {
      pass1Result = await extractRequirements(rawRequirements);
    } catch (err: any) {
      console.error(`[AI PASS 1] FAILED: ${err.message}`);
      throw new Error(`Requirement extraction failed: ${err.message}`);
    }

    const reqCount = pass1Result.requirements?.length || 0;
    const actorCount = pass1Result.actors?.length || 0;
    console.log(`[AI PASS 1] ✓ Requirements extracted: ${reqCount}`);
    console.log(`[AI PASS 1] ✓ Actors identified: ${actorCount} (${(pass1Result.actors || []).join(', ')})`);
    console.log(`[AI PASS 1] ✓ Assumptions: ${pass1Result.assumptions?.length || 0}`);
    console.log(`[AI PASS 1] ✓ Clarifications: ${pass1Result.clarifications?.length || 0}`);
    if (reqCount === 0) {
      throw new Error('AI could not extract any requirements from the provided text. Please check your requirements and try again.');
    }

    // ── Pass 2: Generate Agile Plan ───────────────────────────────────────────
    console.log(`\n[AI PASS 2] Generating Agile plan from ${reqCount} requirements...`);
    let pass2Result: any;
    try {
      pass2Result = await generatePlan(pass1Result, sprintCapacity, existingIssues.map(i => i.title));
    } catch (err: any) {
      console.error(`[AI PASS 2] FAILED: ${err.message}`);
      throw new Error(`Agile plan generation failed: ${err.message}`);
    }

    const moduleCount = pass2Result.modules?.length || 0;
    const storyCount = (pass2Result.modules || []).reduce((a: number, m: any) => a + (m.stories?.length || 0), 0);
    const taskCount = (pass2Result.modules || []).reduce((a: number, m: any) =>
      a + (m.stories || []).reduce((b: number, s: any) => b + (s.tasks?.length || 0), 0), 0);
    const totalPoints = (pass2Result.sprints || []).reduce((a: number, s: any) => a + (s.totalStoryPoints || 0), 0);

    console.log(`[AI PASS 2] ✓ Modules generated: ${moduleCount}`);
    console.log(`[AI PASS 2] ✓ Stories generated: ${storyCount}`);
    console.log(`[AI PASS 2] ✓ Tasks generated: ${taskCount}`);
    console.log(`[AI PASS 2] ✓ Total story points: ${totalPoints}`);
    console.log(`[AI PASS 2] ✓ Sprints planned: ${pass2Result.sprints?.length || 0}`);

    // ── Schema Validation & Fibonacci Repair ──────────────────────────────────
    console.log(`\n[5] JSON/schema validation starting...`);
    const { repairedPlan, errors } = validateAndRepairPlan(pass2Result);
    if (errors.length > 0) {
      console.log(`[AI VALIDATOR] Repaired ${errors.length} schema issues:`);
      errors.forEach(e => console.log(`  - [${e.path}] ${e.message}`));
    } else {
      console.log(`[AI VALIDATOR] ✓ Schema valid, no repairs needed`);
    }

    // ── Pass 3: Coverage Check & Gap Fill ─────────────────────────────────────
    console.log(`\n[AI PASS 3] Running requirement coverage check...`);
    const validatedPlan = await validateAndFillGaps(repairedPlan, pass1Result.requirements || [], sprintCapacity);

    const coverage = validatedPlan.validation?.requirementCoverage || 0;
    const unrelated = validatedPlan.validation?.unrelatedItems?.length || 0;
    const invalidPts = validatedPlan.validation?.invalidStoryPoints?.length || 0;
    const oversized = validatedPlan.validation?.oversizedStories?.length || 0;
    console.log(`[AI PASS 3] ✓ Requirement coverage: ${coverage}%`);
    console.log(`[AI PASS 3] ✓ Unrelated items detected: ${unrelated}`);
    console.log(`[AI PASS 3] ✓ Invalid story points repaired: ${invalidPts}`);
    console.log(`[AI PASS 3] ✓ Oversized stories flagged: ${oversized}`);
    console.log(`[AI PLANNER] ═══════════════════════════════════════\n`);

    // Build final merged response
    return {
      projectSummary: pass2Result.projectSummary || pass1Result.objective || '',
      projectAnalysis: {
        objective: pass1Result.objective || '',
        actors: pass1Result.actors || [],
        assumptions: pass1Result.assumptions || [],
        clarifications: pass1Result.clarifications || [],
        requirements: pass1Result.requirements || []
      },
      assumptions: pass1Result.assumptions || [],
      clarifications: pass1Result.clarifications || [],
      // Use 'modules' internally but also expose as 'epics' for UI back-compat
      modules: validatedPlan.modules || [],
      epics: validatedPlan.modules || [],  // UI compatibility alias
      sprints: validatedPlan.sprints || [],
      validation: validatedPlan.validation || {}
    };
  },

  /**
   * Regenerate a single story or task with user instructions.
   * Validates Fibonacci on the regenerated item before returning.
   */
  async regenerateItem(itemId: string, itemType: string, context: any, promptAddition: string) {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured.');
    const client = new Groq({ apiKey });

    const prompt = `You are an expert Agile Project Manager.
Regenerate a single ${itemType} based on the following context.
Return ONLY valid JSON for the item (no markdown, start with {).

CURRENT ITEM CONTEXT:
${JSON.stringify(context, null, 2)}

USER INSTRUCTION:
${promptAddition || 'Improve this item'}

RULES:
- Story points MUST be Fibonacci: 1, 2, 3, 5, 8, or 13 ONLY.
- Every requirementId in the original context must be preserved.
- If regenerating a TASK: make it SMALL and SPECIFIC (one clear action only). Title must start with a verb (Add, Create, Show, Validate, Connect). NEVER use broad titles like "Create Landing Page" or "Implement Feature".
- If regenerating a STORY: ensure the tasks list contains 5-15 GRANULAR tasks that each describe ONE specific implementation action (component, input, section, API endpoint, DB field).
- Use simple, non-technical language a Junior Developer can understand immediately.
- Return ONLY the JSON. No markdown. Start with {.

${itemType === 'TASK' ? `Return this exact structure:
{
  "id": "${context.id}",
  "sequence": ${context.sequence || 99},
  "title": "improved task title",
  "description": "concrete, simple description of what to implement",
  "why": "Why is this task needed?",
  "expectedResult": "What happens when it is done?",
  "dependency": "None or task ID",
  "category": "FRONTEND|BACKEND|DATABASE|API|TESTING|SECURITY",
  "requirementIds": ${JSON.stringify(context.requirementIds || [])},
  "storyPoints": 2,
  "estimateReason": "why this point value",
  "priority": "HIGH|MEDIUM|LOW"
}` : `Return this exact structure:
{
  "id": "${context.id}",
  "sequence": ${context.sequence || 99},
  "title": "improved story title",
  "userStory": "As a [role], I want [feature], so that [value].",
  "description": "detailed description",
  "requirementIds": ${JSON.stringify(context.requirementIds || [])},
  "storyPoints": 5,
  "estimateReason": "why this point value",
  "needsSplit": false,
  "priority": "HIGH|MEDIUM|LOW",
  "acceptanceCriteria": ["criterion 1", "criterion 2"],
  "dependencies": [],
  "tasks": [...]
}`}`;

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    let text = completion.choices[0]?.message?.content || '{}';
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    const parsed = JSON.parse(text.substring(startIdx, endIdx + 1));

    // Validate and repair Fibonacci on the regenerated item
    const { repairFibonacci, isValidFibonacci } = await import('./aiValidator');
    if (!isValidFibonacci(parsed.storyPoints)) {
      parsed.storyPoints = repairFibonacci(parsed.storyPoints);
    }
    if (Array.isArray(parsed.tasks)) {
      parsed.tasks.forEach((t: any) => {
        if (!isValidFibonacci(t.storyPoints)) t.storyPoints = repairFibonacci(t.storyPoints);
      });
    }

    return parsed;
  }
};
