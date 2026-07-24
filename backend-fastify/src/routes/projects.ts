import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Project } from '../models/Project';
import { Sprint } from '../models/Sprint';
import { Epic } from '../models/Epic';
import { Status } from '../models/Status';
import { authenticate } from '../middlewares/auth';

const defaultWorkspaceId = 'forge-india-connect';

export async function projectRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  // 1. GET all projects for a workspace
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { workspaceId } = request.query as any;
      const activeWorkspaceId = workspaceId || request.user?.workspaceId || defaultWorkspaceId;
      const projects = await Project.find({ workspaceId: activeWorkspaceId }).sort({ createdAt: -1 });

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
        const pObj = project.toObject ? project.toObject() : project;
        pObj.sprints = sprints;
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
      });

      // Default backlog
      await Sprint.create({
        projectId: project.id,
        name: 'Backlog (Unplanned)',
        status: 'PLANNING',
      });

      return reply.code(201).send(project);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to create project', details: err.message });
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

  // Velocity / CFD
  fastify.get('/:projectId/velocity', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send([]);
  });

  fastify.get('/:projectId/cfd', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send([]);
  });
}
