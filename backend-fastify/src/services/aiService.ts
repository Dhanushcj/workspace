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

import { GoogleGenerativeAI } from '@google/generative-ai';
import process from 'process';
import { jsonrepair } from 'jsonrepair';
import { validateAndRepairPlan, checkRequirementCoverage } from './aiValidator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in backend environment variables.');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,   // Lower temp for structured output
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  });
}

async function callAI(model: any, prompt: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text();

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
      console.warn(`[AI Retry] Attempt ${i + 1} failed, retrying in 3s... Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// ─── Pass 1: Requirement Analyzer ────────────────────────────────────────────

async function extractRequirements(rawRequirements: string): Promise<any> {
  const model = getModel();

  const prompt = `You are an expert Business Analyst and Requirements Engineer.

Your ONLY job in this step is to extract and structure the requirements from the raw text provided.
Do NOT generate tasks, modules, stories, or sprint plans in this step.

RAW PROJECT REQUIREMENTS:
"""
${rawRequirements}
"""

Extract the following and return as strict JSON (no markdown, no code blocks, start with {):

{
  "objective": "One sentence describing the project purpose",
  "actors": ["Role1", "Role2"],
  "requirements": [
    {
      "id": "FR-001",
      "title": "Short title of the requirement",
      "description": "One to two sentence description",
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
  "clarifications": ["What is unclear or needs decision from the client?"],
  "securityRequirements": ["Role-based access control is required"]
}

RULES:
1. Every distinct feature, role, screen, or operation must become a separate requirement with a unique ID starting at FR-001.
2. IDs must be sequential: FR-001, FR-002, FR-003, etc.
3. Do NOT invent requirements that are not in the text. If the text says "student login" make FR-001 = "Student Authentication". Do not add "payment gateway" unless the text mentions payments.
4. type must be one of: FUNCTIONAL, NON_FUNCTIONAL, SECURITY, TECHNICAL
5. priority must be one of: HIGH, MEDIUM, LOW
6. Extract ALL requirements — do not summarize multiple features into one if they are distinct.
7. Return ONLY the JSON object. No explanations. No markdown.`;

  return callAI(model, prompt);
}

// ─── Pass 2: Agile Planner ────────────────────────────────────────────────────

async function generatePlan(
  pass1Result: any,
  sprintCapacity: number,
  existingIssueTitles: string[]
): Promise<any> {
  const model = getModel();

  const requirementsJson = JSON.stringify(pass1Result.requirements, null, 2);
  const existingIssuesStr = existingIssueTitles.length > 0
    ? `\nEXISTING TASKS (already in the project — DO NOT duplicate these):\n${existingIssueTitles.map((t, i) => `- ${t}`).join('\n')}`
    : '\nNo existing tasks found. Generate fresh plan.';

  const prompt = `You are an expert Agile Product Manager, Software Architect, and Scrum Master.

You have been given a structured list of project requirements extracted by a Business Analyst.
Your job is to generate a complete, traceable Agile implementation plan.

PROJECT OBJECTIVE: ${pass1Result.objective}
ACTORS / ROLES: ${(pass1Result.actors || []).join(', ')}

EXTRACTED REQUIREMENTS:
${requirementsJson}

SPRINT CONFIGURATION:
- Sprint Capacity: ${sprintCapacity} story points per sprint
- Use Fibonacci story points ONLY: 1, 2, 3, 5, 8, 13
${existingIssuesStr}

INSTRUCTIONS:

STEP 1 — MODULE GROUPING:
Group related requirements into logical modules (epics).
Example: FR-001 (Student Login) + FR-002 (Faculty Login) + FR-003 (Admin Login) → Module: "Authentication & Role Management"
Do NOT create a separate module for every single requirement.
Do NOT create modules that have no corresponding requirement.

STEP 2 — USER STORIES:
For each requirement, write a user story in proper Agile format:
"As a [role], I want [feature], so that [business value]."
Provide 3-5 acceptance criteria (testable, specific).

STEP 3 — TASKS:
For each story, generate 2-3 concrete, high-level implementation tasks (e.g., Frontend, Backend, Testing).
Keep descriptions CONCISE (1 sentence max) to avoid exceeding output limits.
BAD tasks: "Start development", "Write code", "Complete feature", "Test application"
GOOD tasks: "Design attendance UI component", "Create POST /api/attendance endpoint", "Write unit tests for attendance service"

STEP 4 — STORY POINT ESTIMATION (FIBONACCI ONLY: 1, 2, 3, 5, 8, 13):
1 = Trivial change (CSS tweak, label change)
2 = Small simple feature (read-only list page)
3 = Small feature with limited complexity (simple form with validation)
5 = Moderate feature involving multiple components (CRUD with auth)
8 = Large feature with multiple layers (real-time, integrations)
13 = Very large/uncertain (MARK needsSplit: true and suggest splits)
Provide estimateReason explaining WHY you chose that point value.

STEP 5 — DEPENDENCIES:
Identify which stories depend on other stories.
Example: Attendance story depends on Course Management and Student Management.

STEP 6 — SPRINT PLANNING:
Group stories into sprints respecting:
- Sprint capacity of ${sprintCapacity} points
- Dependency order (authentication before features that need auth)
- Logical progression

Return ONLY this exact JSON structure (no markdown, start with {):

{
  "projectSummary": "Brief one-paragraph project summary",
  "modules": [
    {
      "id": "MOD-001",
      "name": "Module Name",
      "description": "What this module covers",
      "requirementIds": ["FR-001", "FR-002"],
      "priority": "HIGH",
      "stories": [
        {
          "id": "ST-001",
          "title": "Story title",
          "userStory": "As a [role], I want [feature], so that [value].",
          "description": "Detailed description",
          "requirementIds": ["FR-001"],
          "storyPoints": 5,
          "estimateReason": "Requires frontend form, backend API, DB schema, role-based auth, and testing — 5 points.",
          "needsSplit": false,
          "priority": "HIGH",
          "acceptanceCriteria": [
            "User can submit form with valid data",
            "System validates required fields",
            "Error message shown for invalid input",
            "Successful submission redirects to dashboard"
          ],
          "dependencies": [],
          "tasks": [
            {
              "id": "TASK-001",
              "title": "Create login form UI component",
              "description": "Build the login page with email/password fields and validation states",
              "category": "FRONTEND",
              "requirementIds": ["FR-001"],
              "storyPoints": 2,
              "estimateReason": "Standard form component with validation — 2 points.",
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
      "goal": "Establish authentication and core user management",
      "storyIds": ["ST-001"],
      "totalStoryPoints": 5
    }
  ],
  "assumptions": ["Assumption 1"],
  "clarifications": ["Unclear point requiring client decision"]
}

CRITICAL RULES:
- Every module, story, and task MUST have at least one requirementId from the list above.
- Only use requirement IDs that exist in the provided requirements list: ${(pass1Result.requirements || []).map((r: any) => r.id).join(', ')}
- Story points MUST be one of: 1, 2, 3, 5, 8, 13. No other values allowed.
- Tasks must be concrete engineering actions. No vague tasks.
- Do NOT generate modules/features not covered by the requirements.
- Do NOT duplicate existing tasks: ${existingIssueTitles.slice(0, 20).join('; ')}
- Keep descriptions concise. Do NOT generate massive text blocks.
- Sprints must not exceed ${sprintCapacity} story points.
- Return ONLY the JSON object. No explanations. No markdown. Start with {.`;

  return callAI(model, prompt);
}

// ─── Pass 3: Validator / Gap Filler ──────────────────────────────────────────

async function validateAndFillGaps(
  plan: any,
  requirements: any[],
  sprintCapacity: number
): Promise<any> {
  const model = getModel();

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
  const prompt = `You are a senior Agile coach validating a project plan.

The following requirements have NO implementation plan (no module, story, or task references them).
Generate ONLY the missing modules/stories/tasks for these requirements.
Append them to the existing plan.

MISSING REQUIREMENTS:
${JSON.stringify(missingReqs, null, 2)}

UNRELATED MODULES DETECTED (may not be required):
${coverage.unrelatedModules.join(', ') || 'None'}

EXISTING PLAN SUMMARY (do not repeat these):
${(plan.modules || []).map((m: any) => m.name).join(', ')}

SPRINT CAPACITY: ${sprintCapacity} points

Return ONLY JSON with this structure (start with {):
{
  "additionalModules": [
    {
      "id": "MOD-NEW-001",
      "name": "Module Name",
      "description": "Description",
      "requirementIds": ["FR-XXX"],
      "priority": "HIGH",
      "stories": [...]
    }
  ],
  "removedModuleNames": ["Name of unrelated module to remove if any"]
}

Use Fibonacci points only: 1, 2, 3, 5, 8, 13.
Return ONLY the JSON. No markdown.`;

  let gapResult: any = { additionalModules: [], removedModuleNames: [] };
  try {
    gapResult = await callAI(model, prompt);
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
    console.log(`\n[AI VALIDATOR] Running schema validation and Fibonacci repair...`);
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
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { temperature: 0.3 } });

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
- Tasks must be concrete engineering actions.
- Return ONLY the JSON. No markdown. Start with {.

${itemType === 'TASK' ? `Return this exact structure:
{
  "id": "${context.id}",
  "title": "improved task title",
  "description": "concrete description of what to implement",
  "category": "FRONTEND|BACKEND|DATABASE|API|TESTING|SECURITY",
  "requirementIds": ${JSON.stringify(context.requirementIds || [])},
  "storyPoints": 2,
  "estimateReason": "why this point value",
  "priority": "HIGH|MEDIUM|LOW"
}` : `Return this exact structure:
{
  "id": "${context.id}",
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

    const result = await model.generateContent(prompt);
    let text = result.response.text();
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
