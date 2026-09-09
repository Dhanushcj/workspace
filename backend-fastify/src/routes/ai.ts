import { FastifyPluginAsync } from 'fastify';
import { AIProjectPlan } from '../models/AIProjectPlan';
import { aiService } from '../services/aiService';
import { Epic } from '../models/Epic';
import { Sprint } from '../models/Sprint';
import { Issue } from '../models/Issue';

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/project-plan/analyze', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { projectId, requirements, sprintCapacity } = request.body as any;
    try {
      // Clear existing drafts for this project
      await AIProjectPlan.deleteMany({ projectId, status: 'DRAFT' });

      const result = await aiService.analyzeRequirements(requirements, sprintCapacity || 40);
      
      const draft = new AIProjectPlan({
        projectId,
        status: 'DRAFT',
        projectSummary: result.projectSummary,
        assumptions: result.assumptions,
        clarifications: result.clarifications,
        epics: result.epics,
        sprints: result.sprints
      });
      await draft.save();

      return reply.send(draft);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ message: err.message || 'AI Analysis failed' });
    }
  });

  fastify.get('/project-plan/:projectId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const draft = await AIProjectPlan.findOne({ projectId, status: 'DRAFT' }).sort({ createdAt: -1 });
    if (!draft) {
      return reply.send(null);
    }
    return reply.send(draft);
  });

  fastify.post('/project-plan/regenerate', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { itemId, itemType, context, promptAddition } = request.body as any;
    try {
      const result = await aiService.regenerateItem(itemId, itemType, context, promptAddition);
      return reply.send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ message: err.message || 'Regeneration failed' });
    }
  });

  fastify.post('/project-plan/approve', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { planId, approvedEpicIds, approvedStoryIds, approvedTaskIds } = request.body as any;
    const plan = await AIProjectPlan.findById(planId);
    if (!plan) return reply.code(404).send({ message: 'Plan not found' });

    const workspaceId = (request.user as any)?.workspaceId || 'forge-india-connect';
    const creatorId = (request.user as any)?.id || 'system';

    const sprintMap: Record<string, string> = {}; 
    const epicMap: Record<string, string> = {};

    for (const s of plan.sprints) {
      const sprint = new Sprint({
        projectId: plan.projectId,
        name: s.name,
        goal: s.goal,
        status: 'PLANNING'
      });
      await sprint.save();
      sprintMap[s.id] = sprint.id;
    }

    const getSprintForStory = (sId: string) => {
      const sp = plan.sprints.find(s => s.storyIds.includes(sId));
      return sp ? sprintMap[sp.id] : undefined;
    };

    for (const e of plan.epics) {
      if (approvedEpicIds.includes(e.id)) {
        const epic = new Epic({
          projectId: plan.projectId,
          name: e.name,
          description: e.description,
          status: 'TODO'
        });
        await epic.save();
        epicMap[e.id] = epic.id;
      }

      for (const s of e.stories) {
        if (approvedStoryIds.includes(s.id)) {
          const sprintId = getSprintForStory(s.id);
          const story = new Issue({
            workspaceId,
            projectId: plan.projectId,
            epicId: epicMap[e.id],
            sprintId,
            title: s.title,
            description: s.description + '\n\n**User Story:** ' + s.userStory + '\n\n**Acceptance Criteria:**\n- ' + s.acceptanceCriteria.join('\n- '),
            type: 'STORY',
            status: 'TO_DO',
            priority: s.priority || 'MEDIUM',
            storyPoints: s.storyPoints,
            creatorId
          });
          await story.save();
        }

        for (const t of s.tasks) {
          if (approvedTaskIds.includes(t.id)) {
            const sprintId = getSprintForStory(s.id);
            const task = new Issue({
              workspaceId,
              projectId: plan.projectId,
              epicId: epicMap[e.id],
              sprintId,
              title: t.title,
              description: t.description + (t.assigneeReason ? '\n\n**AI Note:** ' + t.assigneeReason : ''),
              type: 'TASK',
              status: 'TO_DO',
              priority: t.priority || 'MEDIUM',
              storyPoints: t.storyPoints,
              creatorId
            });
            await task.save();
          }
        }
      }
    }

    plan.status = 'APPROVED';
    await plan.save();

    return reply.send({ success: true, message: 'Plan applied successfully' });
  });
};
