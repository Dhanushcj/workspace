import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Issue } from '../models/Issue';
import { ProjectMember } from '../models/ProjectMember';
import { User } from '../models/User';
import { authenticate } from '../middlewares/auth';

const defaultWorkspaceId = 'forge-india-connect';

export async function issueRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  const isLeadOrManager = (role: string) => {
    if (!role) return false;
    const r = role.toUpperCase();
    return ['TEAM_LEAD', 'TEAM LEAD', 'MANAGER', 'ADMIN', 'SUPER-ADMIN', 'COMPANY-ADMIN'].includes(r);
  };

  const checkIssueAccess = async (request: FastifyRequest, issueProjectId: string) => {
    const role = request.user?.role || 'DEVELOPER';
    if (isLeadOrManager(role)) return true;
    const member = await ProjectMember.findOne({ projectId: issueProjectId, userId: request.user?.id }).lean();
    return !!member;
  };

  // 1. GET all issues (filters: projectId, sprintId)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId, sprintId, workspaceId, type, status, assigneeId } = request.query as any;
      const activeWorkspaceId = workspaceId || request.user?.workspaceId || defaultWorkspaceId;
      const role = request.user?.role || 'DEVELOPER';

      let allowedProjectIds: string[] | null = null;
      if (!isLeadOrManager(role)) {
        const memberships = await ProjectMember.find({ userId: request.user?.id }).lean();
        allowedProjectIds = memberships.map(m => m.projectId);
      }

      const filter: any = { workspaceId: activeWorkspaceId };
      if (allowedProjectIds) {
        if (projectId) {
          if (!allowedProjectIds.includes(projectId)) {
             return reply.code(403).send({ error: 'Access denied to this project' });
          }
          filter.projectId = projectId;
        } else {
          filter.projectId = { $in: allowedProjectIds };
        }
      } else if (projectId) {
        filter.projectId = projectId;
      }

      if (sprintId) filter.sprintId = sprintId;
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (assigneeId) filter.assigneeId = assigneeId;

      const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();

      // Populate assignee details efficiently (Fix N+1 query)
      const assigneeIds = [...new Set(issues.filter((i: any) => i.assigneeId).map((i: any) => i.assigneeId))];
      const users = await User.find({ _id: { $in: assigneeIds } }).lean();
      const userMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatarUrl
        };
        return acc;
      }, {});

      const populatedIssues = issues.map((issue: any) => {
        if (issue.assigneeId && userMap[issue.assigneeId.toString()]) {
          issue.assignee = userMap[issue.assigneeId.toString()];
        }
        // UI expects id instead of _id
        issue.id = issue._id;
        return issue;
      });

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

      if (!(await checkIssueAccess(request, body.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
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

      const existingIssue = await Issue.findById(id).lean();
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

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
      const existingIssue = await Issue.findById(id).lean();
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

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

      const existingIssue = await Issue.findById(id).lean();
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }
      
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

      const existingIssue = await Issue.findById(id).lean();
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

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
      
      const role = (request.user?.role || 'DEVELOPER').toUpperCase().replace(/ /g, '_');
      if (role !== 'TEAM_LEAD' && role !== 'MANAGER' && role !== 'ADMIN') {
        const memberships = await ProjectMember.find({ userId: request.user?.id }).lean();
        const allowedProjectIds = memberships.map(m => m.projectId);
        
        const issuesToUpdate = await Issue.find({ _id: { $in: ids } }).lean();
        for (const issue of issuesToUpdate) {
          if (!allowedProjectIds.includes(issue.projectId)) {
             return reply.code(403).send({ error: 'Access denied to some of the issues' });
          }
        }
      }

      await Issue.updateMany({ _id: { $in: ids } }, { $set: updates });
      return reply.code(200).send({ message: 'Issues updated successfully' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to bulk update issues', details: err.message });
    }
  });

  // 6.5 BULK DELETE
  fastify.post('/bulk-delete', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ids } = request.body as any;
      if (!ids || !Array.isArray(ids)) return reply.code(400).send({ error: 'Missing ids array' });
      
      const role = (request.user?.role || 'DEVELOPER').toUpperCase().replace(/ /g, '_');
      if (role !== 'TEAM_LEAD' && role !== 'MANAGER' && role !== 'ADMIN') {
        const memberships = await ProjectMember.find({ userId: request.user?.id }).lean();
        const allowedProjectIds = memberships.map(m => m.projectId);
        
        const issuesToDelete = await Issue.find({ _id: { $in: ids } }).lean();
        for (const issue of issuesToDelete) {
          if (!allowedProjectIds.includes(issue.projectId)) {
             return reply.code(403).send({ error: 'Access denied to some of the issues' });
          }
        }
      }

      await Issue.deleteMany({ _id: { $in: ids } });
      return reply.code(200).send({ message: 'Issues deleted successfully' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to bulk delete issues', details: err.message });
    }
  });
  // 7. GET comments (mock)
  fastify.get('/:id/comments', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send([]);
  });

  // 8. GET issue links (mock)
  fastify.get('/:id/links', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({ linksTo: [], linksFrom: [] });
  });

  // 9. GET time entries (mock)
  fastify.get('/:id/time', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send([]);
  });
}
