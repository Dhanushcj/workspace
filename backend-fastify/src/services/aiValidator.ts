/**
 * aiValidator.ts
 * Standalone validator for AI-generated project plans.
 * Called after each AI pass to enforce schema correctness and business rules.
 */

const VALID_FIBONACCI = [1, 2, 3, 5, 8, 13];

// ─── Fibonacci ────────────────────────────────────────────────────────────────

export function isValidFibonacci(n: number): boolean {
  return VALID_FIBONACCI.includes(n);
}

/**
 * Snaps a story-point value to the nearest valid Fibonacci number.
 * 0 → 1, 4 → 3 or 5, 6 → 5, 10 → 8, 14+ → 13
 */
export function repairFibonacci(n: number): number {
  if (isValidFibonacci(n)) return n;
  // Find nearest valid value
  let nearest = VALID_FIBONACCI[0];
  let minDiff = Math.abs(n - nearest);
  for (const fib of VALID_FIBONACCI) {
    const diff = Math.abs(n - fib);
    if (diff < minDiff) { minDiff = diff; nearest = fib; }
  }
  return nearest;
}

// ─── Schema Validation ────────────────────────────────────────────────────────

export interface ValidationError {
  path: string;
  message: string;
}

export interface PlanValidationResult {
  valid: boolean;
  errors: ValidationError[];
  repairedPlan: any;
}

/**
 * Validates and auto-repairs a full AI-generated plan object.
 * Fixes: missing fields, invalid Fibonacci points, empty arrays.
 */
export function validateAndRepairPlan(plan: any): PlanValidationResult {
  const errors: ValidationError[] = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: [{ path: 'root', message: 'Plan is not a valid object' }], repairedPlan: null };
  }

  // Top-level required fields
  if (!plan.projectAnalysis || typeof plan.projectAnalysis !== 'object') {
    errors.push({ path: 'projectAnalysis', message: 'Missing projectAnalysis object' });
    plan.projectAnalysis = { objective: '', actors: [], assumptions: [], clarifications: [] };
  }
  if (!Array.isArray(plan.projectAnalysis.requirements)) {
    errors.push({ path: 'projectAnalysis.requirements', message: 'requirements must be an array' });
    plan.projectAnalysis.requirements = [];
  }
  if (!Array.isArray(plan.modules)) {
    errors.push({ path: 'modules', message: 'modules must be an array' });
    plan.modules = [];
  }
  if (!Array.isArray(plan.sprints)) {
    errors.push({ path: 'sprints', message: 'sprints must be an array' });
    plan.sprints = [];
  }
  if (!Array.isArray(plan.assumptions)) {
    plan.assumptions = plan.projectAnalysis?.assumptions || [];
  }
  if (!Array.isArray(plan.clarifications)) {
    plan.clarifications = plan.projectAnalysis?.clarifications || [];
  }

  // Validate requirements
  plan.projectAnalysis.requirements.forEach((req: any, i: number) => {
    if (!req.id) {
      req.id = `FR-${String(i + 1).padStart(3, '0')}`;
      errors.push({ path: `requirements[${i}].id`, message: 'Auto-assigned missing requirement ID' });
    }
    if (!req.title) {
      req.title = `Requirement ${req.id}`;
      errors.push({ path: `requirements[${i}].title`, message: 'Missing requirement title' });
    }
    if (!req.type) req.type = 'FUNCTIONAL';
    if (!req.priority) req.priority = 'MEDIUM';
  });

  // Validate modules (epics)
  const oversizedStories: string[] = [];
  const invalidStoryPoints: string[] = [];

  plan.modules.forEach((mod: any, mi: number) => {
    if (!mod.id) { mod.id = `MOD-${String(mi + 1).padStart(3, '0')}`; }
    if (!mod.name) { mod.name = `Module ${mi + 1}`; errors.push({ path: `modules[${mi}].name`, message: 'Missing module name' }); }
    if (!Array.isArray(mod.requirementIds)) { mod.requirementIds = []; }
    if (!Array.isArray(mod.stories)) { mod.stories = []; }

    mod.stories.forEach((story: any, si: number) => {
      if (!story.id) { story.id = `ST-${mi + 1}-${si + 1}`; }
      if (!story.title) { story.title = `Story ${story.id}`; }
      if (!Array.isArray(story.requirementIds)) { story.requirementIds = []; }
      if (!Array.isArray(story.acceptanceCriteria)) { story.acceptanceCriteria = []; }
      if (!Array.isArray(story.dependencies)) { story.dependencies = []; }
      if (!Array.isArray(story.tasks)) { story.tasks = []; }
      if (!story.estimateReason) { story.estimateReason = ''; }
      if (typeof story.needsSplit !== 'boolean') { story.needsSplit = (story.storyPoints >= 13); }

      // Validate/repair story points
      if (!isValidFibonacci(story.storyPoints)) {
        const repaired = repairFibonacci(story.storyPoints || 3);
        invalidStoryPoints.push(`${story.id} (was ${story.storyPoints}, repaired to ${repaired})`);
        errors.push({ path: `modules[${mi}].stories[${si}].storyPoints`, message: `Invalid Fibonacci value ${story.storyPoints}, repaired to ${repaired}` });
        story.storyPoints = repaired;
      }

      if (story.storyPoints === 13) {
        oversizedStories.push(story.id);
        story.needsSplit = true;
      }

      // Validate tasks
      story.tasks.forEach((task: any, ti: number) => {
        if (!task.id) { task.id = `TASK-${mi + 1}-${si + 1}-${ti + 1}`; }
        if (!task.title) { task.title = `Task ${task.id}`; }
        if (!Array.isArray(task.requirementIds)) { task.requirementIds = story.requirementIds || []; }
        if (!task.category) { task.category = 'BACKEND'; }
        if (!task.priority) { task.priority = 'MEDIUM'; }
        if (!task.description) { task.description = ''; }

        // Validate/repair task story points
        if (!isValidFibonacci(task.storyPoints)) {
          const repaired = repairFibonacci(task.storyPoints || 2);
          invalidStoryPoints.push(`${task.id} (was ${task.storyPoints}, repaired to ${repaired})`);
          errors.push({ path: `modules[${mi}].stories[${si}].tasks[${ti}].storyPoints`, message: `Invalid Fibonacci value ${task.storyPoints}, repaired to ${repaired}` });
          task.storyPoints = repaired;
        }
      });
    });
  });

  // Validate sprints
  plan.sprints.forEach((sprint: any, i: number) => {
    if (!sprint.id) { sprint.id = `sprint-${i + 1}`; }
    if (!sprint.name) { sprint.name = `Sprint ${i + 1}`; }
    if (!sprint.goal) { sprint.goal = `Complete sprint ${i + 1} objectives`; }
    if (!Array.isArray(sprint.storyIds)) { sprint.storyIds = []; }
    if (typeof sprint.totalStoryPoints !== 'number') { sprint.totalStoryPoints = 0; }
  });

  // Build validation summary
  if (!plan.validation) {
    plan.validation = { requirementCoverage: 0, unrelatedItems: [], duplicates: [], invalidStoryPoints: [], oversizedStories: [] };
  }
  plan.validation.invalidStoryPoints = invalidStoryPoints;
  plan.validation.oversizedStories = oversizedStories;

  return {
    valid: errors.filter(e => e.message.startsWith('Missing') || e.message.startsWith('Plan')).length === 0,
    errors,
    repairedPlan: plan
  };
}

// ─── Requirement Coverage ─────────────────────────────────────────────────────

export interface CoverageReport {
  coveragePercent: number;
  covered: string[];
  missing: string[];
  unrelatedModules: string[];
}

/**
 * Checks that every extracted requirement (FR-xxx) is referenced by at least
 * one module, story, or task via requirementIds.
 */
export function checkRequirementCoverage(requirements: any[], modules: any[]): CoverageReport {
  const allReqIds = requirements.map((r: any) => r.id);
  const coveredIds = new Set<string>();
  const unrelatedModules: string[] = [];

  for (const mod of modules) {
    // Collect all requirement IDs referenced anywhere in this module
    const modReqIds: string[] = [...(mod.requirementIds || [])];
    for (const story of (mod.stories || [])) {
      modReqIds.push(...(story.requirementIds || []));
      for (const task of (story.tasks || [])) {
        modReqIds.push(...(task.requirementIds || []));
      }
    }

    // Mark covered
    modReqIds.forEach((id: string) => coveredIds.add(id));

    // If a module has ZERO references to any known requirement, flag it as unrelated
    const knownRefs = modReqIds.filter((id: string) => allReqIds.includes(id));
    if (knownRefs.length === 0 && mod.stories?.length > 0) {
      unrelatedModules.push(mod.name || mod.id);
    }
  }

  const covered = allReqIds.filter((id: string) => coveredIds.has(id));
  const missing = allReqIds.filter((id: string) => !coveredIds.has(id));
  const coveragePercent = allReqIds.length > 0 ? Math.round((covered.length / allReqIds.length) * 100) : 100;

  return { coveragePercent, covered, missing, unrelatedModules };
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

export interface DuplicateItem {
  newTitle: string;
  existingId: string;
  existingTitle: string;
}

/**
 * Compares generated task/story titles against existing issue titles.
 * Uses case-insensitive substring matching for fuzzy duplicate detection.
 */
export function detectDuplicates(generatedItems: { id: string; title: string }[], existingIssues: { _id: string; title: string }[]): DuplicateItem[] {
  const duplicates: DuplicateItem[] = [];

  for (const gen of generatedItems) {
    const genNorm = gen.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    for (const existing of existingIssues) {
      const exNorm = existing.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      // Simple substring overlap check: if 70%+ of words match
      const genWords = genNorm.split(' ').filter(w => w.length > 3);
      const exWords = new Set(exNorm.split(' ').filter((w: string) => w.length > 3));
      const matchCount = genWords.filter(w => exWords.has(w)).length;
      if (genWords.length > 0 && matchCount / genWords.length >= 0.7) {
        duplicates.push({ newTitle: gen.title, existingId: existing._id.toString(), existingTitle: existing.title });
        break;
      }
    }
  }

  return duplicates;
}
