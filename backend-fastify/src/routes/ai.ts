import { FastifyPluginAsync } from 'fastify';
import { AIProjectPlan } from '../models/AIProjectPlan';
import { aiService } from '../services/aiService';
import { Epic } from '../models/Epic';
import { Sprint } from '../models/Sprint';
import { Task } from '../models/Task';
import { Issue } from '../models/Issue';
import { Project } from '../models/Project';
import { authenticate } from '../middlewares/auth';
import { detectDuplicates } from '../services/aiValidator';

export const aiRoutes: FastifyPluginAsync = async (fastify) => {

  // ── POST /project-plan/analyze — Run 3-pass AI analysis and save draft ──────────────────
  fastify.post('/project-plan/analyze', { preValidation: [authenticate] }, async (request, reply) => {
    const { projectId, requirements: bodyReqs, sprintCapacity } = request.body as any;
    try {
      request.log.info('[1] Request received: POST /project-plan/analyze');
      if (!projectId) return reply.code(400).send({ message: 'projectId is required' });

      // Retrieve ACTUAL project requirements from DB
      const project = await Project.findById(projectId);
      if (!project) return reply.code(404).send({ message: 'Project not found' });

      const requirements = project.requirements?.trim() || bodyReqs?.trim();

      if (!requirements) {
        return reply.code(400).send({ message: 'No project requirements were found. Add project requirements before generating an AI plan.' });
      }

      request.log.info(`[2] Requirements validated for project: ${project.name}`);
      request.log.info(`[AI PLANNER] Project ID: ${projectId}`);
      request.log.info(`[AI PLANNER] Requirements length: ${requirements.length} characters`);
      request.log.info(`[AI PLANNER] Sprint capacity: ${sprintCapacity || 40} points`);

      // Load existing issues for duplicate detection
      const existingIssues = await Issue.find({ projectId: String(projectId) }, '_id title').lean();
      request.log.info(`[AI PLANNER] Existing issues in project: ${existingIssues.length}`);

      // Delete any existing DRAFT for this project (user is re-analyzing)
      await AIProjectPlan.deleteMany({ projectId: String(projectId), status: 'DRAFT' });

      // Run 3-pass AI analysis
      const result = await aiService.analyzeRequirements(
        requirements,
        sprintCapacity || 40,
        existingIssues as any[]
      );

      // Run duplicate detection across all generated tasks/stories vs existing issues
      const allGeneratedItems: { id: string; title: string }[] = [];
      for (const mod of (result.modules || [])) {
        for (const story of (mod.stories || [])) {
          allGeneratedItems.push({ id: story.id, title: story.title });
          for (const task of (story.tasks || [])) {
            allGeneratedItems.push({ id: task.id, title: task.title });
          }
        }
      }

      const duplicates = detectDuplicates(allGeneratedItems, existingIssues as any[]);
      if (result.validation) {
        result.validation.duplicates = duplicates;
      }
      if (duplicates.length > 0) {
        request.log.info(`[AI PLANNER] Duplicates detected vs existing issues: ${duplicates.length}`);
        duplicates.forEach(d => request.log.info(`  - "${d.newTitle}" matches existing: "${d.existingTitle}"`));
      }

      // Save the validated draft
      const draft = new AIProjectPlan({
        projectId: String(projectId),
        status: 'DRAFT',
        projectSummary: result.projectSummary,
        projectAnalysis: result.projectAnalysis,
        assumptions: result.assumptions || [],
        clarifications: result.clarifications || [],
        modules: result.modules || [],
        sprints: result.sprints || [],
        validation: result.validation || {}
      });
      await draft.save();

      request.log.info(`[6] Database save: Draft saved successfully. ID: ${draft._id}`);

      // Return the draft with 'epics' alias for frontend compatibility
      const responseData = draft.toObject() as any;
      responseData.epics = responseData.modules || [];

      request.log.info('[7] Response returned: Sending AI plan to client');
      return reply.send(responseData);
    } catch (err: any) {
      request.log.error('[AI Analyze Error] ' + err.stack);
      let safeMsg = err.message || 'AI Analysis failed';
      // Scrub API keys from error message if any
      safeMsg = safeMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, '***API_KEY_HIDDEN***');
      return reply.code(500).send({ message: safeMsg });
    }
  });

  // ── GET /project-plan/:projectId — Load existing draft ─────────────────────
  fastify.get('/project-plan/:projectId', { preValidation: [authenticate] }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const draft = await AIProjectPlan.findOne({ projectId: String(projectId), status: 'DRAFT' }).sort({ createdAt: -1 });
      if (!draft) return reply.send(null);

      const responseData = draft.toObject() as any;
      // Expose modules as epics for UI compatibility
      responseData.epics = responseData.modules || [];
      return reply.send(responseData);
    } catch (err: any) {
      request.log.error('[AI GetPlan Error] ' + err.message);
      return reply.send(null); // Return null instead of error so modal still opens
    }
  });

  // ── POST /project-plan/regenerate — Regenerate single story or task ─────────
  fastify.post('/project-plan/regenerate', { preValidation: [authenticate] }, async (request, reply) => {
    const { itemId, itemType, context, promptAddition } = request.body as any;
    try {
      request.log.info(`[AI REGENERATE] Regenerating ${itemType}: ${itemId}`);
      const result = await aiService.regenerateItem(itemId, itemType, context, promptAddition);
      return reply.send(result);
    } catch (err: any) {
      request.log.error('[AI Regenerate Error] ' + err.message);
      return reply.code(500).send({ message: err.message || 'Regeneration failed' });
    }
  });

  // Helper to standardize role checking for team leads and managers
  const isLeadOrManager = (role: string) => {
    if (!role) return false;
    const r = role.toUpperCase();
    return ['TEAM_LEAD', 'TEAM LEAD', 'MANAGER', 'ADMIN', 'SUPER-ADMIN', 'COMPANY-ADMIN'].includes(r);
  };

  // ── POST /project-plan/approve — Save approved plan to Sprint Board ─────────
  fastify.post('/project-plan/approve', { preValidation: [authenticate] }, async (request, reply) => {
    // TEAM_LEAD permission check
    const userRole = (request.user as any)?.role;
    if (!isLeadOrManager(userRole)) {
      return reply.code(403).send({ message: 'Only Team Leads and Managers can approve AI plans.' });
    }

    const { planId, approvedEpicIds, approvedStoryIds, approvedTaskIds } = request.body as any;

    try {
      const plan = await AIProjectPlan.findById(planId);
      if (!plan) return reply.code(404).send({ message: 'Plan not found' });

      request.log.info(`[AI APPROVE] Approving plan ${planId} for project ${plan.projectId}`);
      request.log.info(`[AI APPROVE] Approved modules: ${approvedEpicIds?.length || 0}`);
      request.log.info(`[AI APPROVE] Approved stories: ${approvedStoryIds?.length || 0}`);
      request.log.info(`[AI APPROVE] Approved tasks: ${approvedTaskIds?.length || 0}`);

      const projectIdStr = plan.projectId.toString();
      const creatorId = (request.user as any)?.id || 'system';

      // BUG FIX 1: Get real workspaceId from the project document, not hardcoded
      const projectDoc = await Project.findById(projectIdStr).lean() as any;
      const workspaceId = projectDoc?.workspaceId || (request.user as any)?.workspaceId || 'forge-india-connect';

      const sprintMap: Record<string, string> = {};
      const epicMap: Record<string, string> = {};

      // BUG FIX 2: Only create sprints if there are any; if sprints is empty, issues go to backlog (sprintId: null)
      for (const s of (plan.sprints || [])) {
        if (!s.id || !s.name) continue;
        const sprint = new Sprint({
          projectId: projectIdStr,
          name: s.name,
          goal: s.goal || '',
          status: 'PLANNING'
        });
        await sprint.save();
        sprintMap[s.id] = sprint._id.toString();
        request.log.info(`[AI APPROVE] Created sprint: "${s.name}" (${sprint._id})`);
      }

      const getSprintForStory = (sId: string): string | null => {
        const sp = (plan.sprints || []).find((s: any) => Array.isArray(s.storyIds) && s.storyIds.includes(sId));
        return sp ? (sprintMap[sp.id] || null) : null;
      };

      const modules: any[] = (plan as any).modules || [];

      // BUG FIX 3: Track story issue DB IDs so tasks can link parentId
      const storyIssueMap: Record<string, string> = {};

      for (const mod of modules) {
        const modId = mod.id || '';

        // Create Epic if approved
        if ((approvedEpicIds || []).includes(modId)) {
          const reqIds = (mod.requirementIds || []).join(', ');
          const epic = new Epic({
            projectId: projectIdStr,
            name: mod.name,
            description: (mod.description || '') + (reqIds ? ` [Requirements: ${reqIds}]` : ''),
            status: 'TODO'
          });
          await epic.save();
          epicMap[modId] = epic._id.toString();
          request.log.info(`[AI APPROVE] Created epic/module: "${mod.name}" (${epic._id})`);
        }

        // Create Story Issues first, then Tasks linked to them
        for (const story of (mod.stories || [])) {
          let storyIssueId: string | null = null;

          if ((approvedStoryIds || []).includes(story.id)) {
            const sprintId = getSprintForStory(story.id);
            const acText = Array.isArray(story.acceptanceCriteria)
              ? story.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n')
              : '';
            const reqIdsStr = (story.requirementIds || []).join(', ');

            const descParts = [
              story.description || '',
              story.userStory ? `\n\n**User Story:** ${story.userStory}` : '',
              acText ? `\n\n**Acceptance Criteria:**\n${acText}` : '',
              story.estimateReason ? `\n\n**Estimate Reason:** ${story.estimateReason}` : '',
              reqIdsStr ? `\n\n**Requirements:** ${reqIdsStr}` : ''
            ];

            const storyIssue = new Issue({
              workspaceId,
              projectId: projectIdStr,
              epicId: epicMap[modId] || undefined,
              sprintId: sprintId || undefined,
              title: story.title,
              description: descParts.join(''),
              type: 'STORY',
              status: 'TO_DO',
              priority: story.priority || 'MEDIUM',
              storyPoints: story.storyPoints,
              creatorId
            });
            await storyIssue.save();
            storyIssueId = storyIssue._id.toString();
            storyIssueMap[story.id] = storyIssueId;
            request.log.info(`[AI APPROVE] Created story: "${story.title}" (${storyIssue._id})`);
          }

          // Create Task Issues linked to their parent story
          for (const task of (story.tasks || [])) {
            if ((approvedTaskIds || []).includes(task.id)) {
              const sprintId = getSprintForStory(story.id);
              const reqIdsStr = (task.requirementIds || story.requirementIds || []).join(', ');

              const taskDescParts = [
                task.description || '',
                task.estimateReason ? `\n\n**Estimate Reason:** ${task.estimateReason}` : '',
                reqIdsStr ? `\n\n**Requirements:** ${reqIdsStr}` : ''
              ];

              const taskIssue = new Issue({
                workspaceId,
                projectId: projectIdStr,
                epicId: epicMap[modId] || undefined,
                sprintId: sprintId || undefined,
                // BUG FIX 3: Link task to parent story issue
                parentId: storyIssueId || storyIssueMap[story.id] || undefined,
                title: task.title,
                description: taskDescParts.join(''),
                type: 'TASK',
                status: 'TO_DO',
                priority: task.priority || 'MEDIUM',
                storyPoints: task.storyPoints,
                creatorId
              });
              await taskIssue.save();
              request.log.info(`[AI APPROVE] Created task: "${task.title}" (${taskIssue._id})`);

              // Legacy Task record for old dashboard views
              const legacyTask = new Task({
                workspaceId,
                projectId: projectIdStr,
                title: task.title,
                description: taskDescParts.join(''),
                status: 'todo',
                priority: (task.priority || 'MEDIUM').toLowerCase(),
                createdByEmail: (request.user as any)?.email || 'ai-planner@system.local',
              });
              await legacyTask.save();
            }
          }
        }
      }

      plan.status = 'APPROVED';
      await plan.save();

      const totalCreated = Object.keys(storyIssueMap).length;
      request.log.info(`[AI APPROVE] ✓ Plan approved. Project: ${projectIdStr}. Stories: ${totalCreated}`);

      return reply.send({ success: true, message: 'Plan applied successfully', projectId: projectIdStr });
    } catch (err: any) {
      request.log.error('[AI APPROVE Error] ' + err.stack);
      return reply.code(500).send({ message: err.message || 'Approval failed' });
    }
  });
};
