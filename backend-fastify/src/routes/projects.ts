import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Project } from '../models/Project';
import { Sprint } from '../models/Sprint';
import { Epic } from '../models/Epic';
import { Status } from '../models/Status';
import { authenticate } from '../middlewares/auth';
import { ProjectMember } from '../models/ProjectMember';
import { User } from '../models/User';

const defaultWorkspaceId = 'forge-india-connect';

export async function projectRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  // 1. GET all projects for a workspace
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { workspaceId } = request.query as any;
      const activeWorkspaceId = workspaceId || request.user?.workspaceId || defaultWorkspaceId;
      const role = request.user?.role || 'DEVELOPER';
      
      let projectIds: string[] | null = null;
      if (role !== 'TEAM_LEAD' && role !== 'MANAGER') {
        const memberships = await ProjectMember.find({ userId: request.user?.id }).lean();
        projectIds = memberships.map(m => m.projectId);
      }

      const filter: any = { workspaceId: activeWorkspaceId };
      if (projectIds) {
        filter._id = { $in: projectIds };
      }

      const projects = await Project.find(filter).sort({ createdAt: -1 });

      // If no projects exist for the workspace, create a default "Platform" project
      if (projects.length === 0) {
        const defaultProject = await Project.create({
          workspaceId: activeWorkspaceId,
          name: 'Platform',
          description: 'Default project for platform development',
        });
        
        // Also create a default backlog sprint
        await Sprint.create({
          projectId: defaultProject.id,
          name: 'Backlog (Unplanned)',
          status: 'PLANNING',
        });

        // Add default statuses
        const statuses = [
          { name: 'To Do', key: 'TO_DO', color: '#94a3b8', order: 1 },
          { name: 'In Progress', key: 'IN_PROGRESS', color: '#3b82f6', order: 2 },
          { name: 'In Review', key: 'PR_SUBMITTED', color: '#eab308', order: 3 },
          { name: 'Testing', key: 'TESTING', color: '#a855f7', order: 4 },
          { name: 'Done', key: 'DONE', color: '#22c55e', order: 5 },
          { name: 'Blocked', key: 'BLOCKED', color: '#ef4444', order: 6 },
        ];

        for (const status of statuses) {
          await Status.create({
            projectId: defaultProject.id,
            ...status
          });
        }

        projects.push(defaultProject);
      }

      // Populate sprints for each project so workflowStore can pick up activeSprint
      const populatedProjects = await Promise.all(projects.map(async (project: any) => {
        const sprints = await Sprint.find({ projectId: project._id }).sort({ createdAt: -1 }).lean();
        const memberCount = await ProjectMember.countDocuments({ projectId: project._id });
        const pObj = project.toObject ? project.toObject() : project;
        pObj.sprints = sprints;
        pObj.memberCount = memberCount;
        return pObj;
      }));

      return reply.code(200).send(populatedProjects);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch projects.', details: err.message });
    }
  });

  // 2. CREATE a project
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      const workspaceId = request.user?.workspaceId || defaultWorkspaceId;
      const project = await Project.create({
        workspaceId,
        name: body.name,
        description: body.description,
        requirements: body.requirements,
      });

      // Default backlog
      await Sprint.create({
        projectId: project.id,
        name: 'Backlog (Unplanned)',
        status: 'PLANNING',
      });

      if (body.members && Array.isArray(body.members)) {
        const memberDocs = body.members.map((userId: string) => ({
          projectId: project.id,
          userId,
          assignedBy: request.user?.id || 'system',
        }));
        await ProjectMember.insertMany(memberDocs);
      }

      return reply.code(201).send(project);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to create project', details: err.message });
    }
  });

  // 2.5 UPDATE a project
  fastify.patch('/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const updates = request.body as any;
      
      const project = await Project.findByIdAndUpdate(
        projectId,
        { $set: updates },
        { new: true }
      );
      
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      
      return reply.code(200).send(project);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update project', details: err.message });
    }
  });

  // 3. Sprints for a project
  fastify.get('/:projectId/sprints', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const sprints = await Sprint.find({ projectId }).sort({ createdAt: -1 });
      return reply.code(200).send(sprints);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch sprints' });
    }
  });

  fastify.post('/:projectId/sprints', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const sprint = await Sprint.create({ projectId, ...request.body as any });
      return reply.code(201).send(sprint);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to create sprint' });
    }
  });

  // 4. Epics for a project
  fastify.get('/:projectId/epics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const epics = await Epic.find({ projectId }).sort({ createdAt: -1 });
      return reply.code(200).send(epics);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch epics' });
    }
  });

  fastify.post('/:projectId/epics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const epic = await Epic.create({ projectId, ...request.body as any });
      return reply.code(201).send(epic);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to create epic' });
    }
  });

  // 5. Statuses for a project
  fastify.get('/:projectId/statuses', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const statuses = await Status.find({ projectId }).sort({ order: 1 });
      return reply.code(200).send(statuses);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch statuses' });
    }
  });

  fastify.post('/:projectId/statuses', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const status = await Status.create({ projectId, ...request.body as any });
      return reply.code(201).send(status);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to create status' });
    }
  });

  fastify.patch('/statuses/:statusId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { statusId } = request.params as any;
      const updates = request.body as any;
      const status = await Status.findByIdAndUpdate(statusId, updates, { new: true });
      if (!status) return reply.code(404).send({ error: 'Status not found' });
      return reply.code(200).send(status);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update status' });
    }
  });

  fastify.delete('/statuses/:statusId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { statusId } = request.params as any;
      const status = await Status.findByIdAndDelete(statusId);
      if (!status) return reply.code(404).send({ error: 'Status not found' });
      return reply.code(200).send({ message: 'Status deleted' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to delete status' });
    }
  });

  // 6. Member Assignment Endpoints
  fastify.get('/:projectId/members', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as any;
      const memberships = await ProjectMember.find({ projectId }).lean();
      const userIds = memberships.map(m => m.userId);
      const users = await User.find({ _id: { $in: userIds } }, 'name email avatarUrl role').lean();
      return reply.code(200).send(users);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch members' });
    }
  });

  fastify.post('/:projectId/members', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (request.user?.role !== 'TEAM_LEAD') {
        return reply.code(403).send({ error: 'Only Team Leads can assign members' });
      }
      const { projectId } = request.params as any;
      const { userIds } = request.body as any;
      if (!Array.isArray(userIds)) return reply.code(400).send({ error: 'userIds must be an array' });

      const existing = await ProjectMember.find({ projectId }).lean();
      const existingIds = new Set(existing.map(m => m.userId));

      const newAssignments = userIds.filter(id => !existingIds.has(id)).map(id => ({
        projectId,
        userId: id,
        assignedBy: request.user?.id || 'system'
      }));

      if (newAssignments.length > 0) {
        await ProjectMember.insertMany(newAssignments);
      }

      const toRemove = Array.from(existingIds).filter(id => !userIds.includes(id as string));
      if (toRemove.length > 0) {
        await ProjectMember.deleteMany({ projectId, userId: { $in: toRemove } });
      }

      return reply.code(200).send({ message: 'Members updated successfully' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update members' });
    }
  });

  // Velocity / CFD
  fastify.get('/:projectId/velocity', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send([]);
  });

  fastify.get('/:projectId/cfd', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send([]);
  });
}
