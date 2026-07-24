import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Issue } from '../models/Issue';
import { User } from '../models/User';
import { authenticate } from '../middlewares/auth';

const defaultWorkspaceId = 'forge-india-connect';

export async function issueRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  // 1. GET all issues (filters: projectId, sprintId)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId, sprintId, workspaceId, type, status, assigneeId } = request.query as any;
      const activeWorkspaceId = workspaceId || request.user?.workspaceId || defaultWorkspaceId;

      const filter: any = { workspaceId: activeWorkspaceId };
      if (projectId) filter.projectId = projectId;
      if (sprintId) filter.sprintId = sprintId;
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (assigneeId) filter.assigneeId = assigneeId;

      const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();

      // Populate assignee details
      const populatedIssues = await Promise.all(issues.map(async (issue: any) => {
        if (issue.assigneeId) {
          const user = await User.findById(issue.assigneeId).lean();
          if (user) {
            issue.assignee = {
              id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatarUrl
            };
          }
        }
        // UI expects id instead of _id
        issue.id = issue._id;
        return issue;
      }));

      return reply.code(200).send(populatedIssues);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch issues.', details: err.message });
    }
  });

  // 2. CREATE a new issue
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      const title = String(body.title || '').trim();
      if (!title) {
        return reply.code(400).send({ error: 'Issue title is required.' });
      }
      if (!body.projectId) {
        return reply.code(400).send({ error: 'Project ID is required.' });
      }

      const workspaceId = String(
        body.workspaceId || request.user?.workspaceId || defaultWorkspaceId
      ).trim();

      const issue = await Issue.create({
        workspaceId,
        projectId: body.projectId,
        sprintId: body.sprintId,
        epicId: body.epicId,
        title,
        description: body.description || '',
        status: body.status || 'TO_DO',
        priority: body.priority || 'MEDIUM',
        type: body.type || 'FEATURE',
        assigneeId: body.assigneeId,
        creatorId: request.user?.id || 'system',
        storyPoints: body.storyPoints,
      });

      return reply.code(201).send(issue);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to create issue.', details: err.message });
    }
  });

  // 3. UPDATE an issue
  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const body = request.body as any;

      const issue = await Issue.findByIdAndUpdate(id, body, { new: true });
      if (!issue) {
        return reply.code(404).send({ error: 'Issue not found.' });
      }

      return reply.code(200).send(issue);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update issue.', details: err.message });
    }
  });

  // 4. DELETE an issue
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const issue = await Issue.findByIdAndDelete(id);
      if (!issue) {
        return reply.code(404).send({ error: 'Issue not found.' });
      }
      return reply.code(200).send({ message: 'Issue deleted successfully.' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to delete issue.', details: err.message });
    }
  });
  
  // 5. RAISE Blocker
  fastify.post('/:id/blocker', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { description } = request.body as any;
      
      const issue = await Issue.findByIdAndUpdate(id, { 
        status: 'BLOCKED',
        blockerInfo: {
          reason: description,
          raisedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      }, { new: true });

      if (!issue) {
        return reply.code(404).send({ error: 'Issue not found.' });
      }
      return reply.code(200).send(issue);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to raise blocker.', details: err.message });
    }
  });

  // 6. UPDATE Estimate
  fastify.patch('/:id/estimate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { estimate } = request.body as any;

      const issue = await Issue.findByIdAndUpdate(id, { estimate }, { new: true });
      return reply.code(200).send(issue);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update estimate.', details: err.message });
    }
  });

  // 6. BULK UPDATE
  fastify.patch('/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ids, ...updates } = request.body as any;
      if (!ids || !Array.isArray(ids)) return reply.code(400).send({ error: 'Missing ids array' });
      
      await Issue.updateMany({ _id: { $in: ids } }, { $set: updates });
      return reply.code(200).send({ message: 'Issues updated successfully' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to bulk update issues', details: err.message });
    }
  });
}
