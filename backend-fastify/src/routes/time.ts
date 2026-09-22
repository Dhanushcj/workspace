import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TimeEntry } from '../models/TimeEntry';
import { Issue } from '../models/Issue';
import { authenticate } from '../middlewares/auth';

const defaultWorkspaceId = 'forge-india-connect';

export default async function timeRoutes(fastify: FastifyInstance) {
  
  // 1. Get all time entries (can filter by userId, projectId, taskId)
  fastify.get('/', { preValidation: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const workspaceId = user.workspaceId || defaultWorkspaceId;
      const query = request.query as any;

      const filter: any = { workspaceId };
      if (query.userId) filter.userId = query.userId;
      // If regular user, restrict to their own time unless they are managers/leads?
      // For now, let's just return what's requested. 
      if (query.taskId) filter.taskId = query.taskId;
      if (query.projectId) filter.projectId = query.projectId;
      
      const entries = await TimeEntry.find(filter).sort({ createdAt: -1 });
      return reply.send(entries);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch time entries' });
    }
  });

  // 2. Start a timer for a task
  fastify.post('/start', { preValidation: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const workspaceId = user.workspaceId || defaultWorkspaceId;
      const { taskId } = request.body as any;

      if (!taskId) return reply.code(400).send({ error: 'Task ID is required' });

      // Verify task exists and is IN_PROGRESS
      const task = await Issue.findById(taskId);
      if (!task) return reply.code(404).send({ error: 'Task not found' });
      
      if (task.status !== 'IN_PROGRESS') {
        return reply.code(400).send({ error: 'Timers can only be started for tasks in In Progress stage.' });
      }

      // Stop any existing running timers for this user
      await TimeEntry.updateMany(
        { userId: user.id, isRunning: true },
        { 
          $set: { isRunning: false, endTime: new Date() }
        }
      );

      // Create new timer
      const entry = await TimeEntry.create({
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        userId: user.id,
        startTime: new Date(),
        isRunning: true,
      });

      return reply.code(201).send(entry);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to start timer' });
    }
  });

  // 3. Stop a running timer
  fastify.post('/stop', { preValidation: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { timeEntryId } = request.body as any;

      let filter: any = { userId: user.id, isRunning: true };
      if (timeEntryId) {
        filter = { _id: timeEntryId, userId: user.id };
      }

      const activeEntry = await TimeEntry.findOne(filter);
      
      if (!activeEntry) {
        return reply.code(404).send({ error: 'No active timer found' });
      }

      activeEntry.isRunning = false;
      activeEntry.endTime = new Date();
      await activeEntry.save();

      return reply.send(activeEntry);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to stop timer' });
    }
  });

  // 4. Get active timer for user
  fastify.get('/active', { preValidation: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const activeEntry = await TimeEntry.findOne({ userId: user.id, isRunning: true });
      return reply.send(activeEntry || null);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch active timer' });
    }
  });
}
