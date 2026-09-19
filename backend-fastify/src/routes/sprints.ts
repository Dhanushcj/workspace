import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Sprint } from '../models/Sprint';
import { Issue } from '../models/Issue';
import { authenticate } from '../middlewares/auth';

export const sprintRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', authenticate);

  fastify.get('/:sprintId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sprintId } = request.params as any;
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return reply.code(404).send({ error: 'Sprint not found' });
      }
      return reply.code(200).send(sprint);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch sprint' });
    }
  });

  fastify.get('/:sprintId/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sprintId } = request.params as any;
      const sprint = await Sprint.findById(sprintId).lean();
      if (!sprint) {
        return reply.code(404).send({ error: 'Sprint not found' });
      }

      const issues = await Issue.find({ sprintId }).lean();
      
      const metrics = {
        todoTasks: 0,
        inProgressTasks: 0,
        reviewTasks: 0,
        testingTasks: 0,
        doneTasks: 0,
        activeBlockers: 0
      };

      issues.forEach(issue => {
        if (issue.status === 'TO_DO') metrics.todoTasks++;
        else if (issue.status === 'IN_PROGRESS') metrics.inProgressTasks++;
        else if (issue.status === 'CODE_REVIEW') metrics.reviewTasks++;
        else if (issue.status === 'TESTING') metrics.testingTasks++;
        else if (issue.status === 'DONE') metrics.doneTasks++;
        
        // Count issue as blocked if dependencies exist and are unresolved, or if it explicitly has blockerInfo
        if (issue.blockerInfo || (issue.dependencies && issue.dependencies.length > 0)) {
           // We'll simplify and say if blockerInfo exists, it is blocked
           if (issue.blockerInfo) metrics.activeBlockers++;
        }
      });

      const totalTasks = issues.length;
      const completionRate = totalTasks > 0 ? Math.round((metrics.doneTasks / totalTasks) * 100) : 0;

      return reply.code(200).send({
        sprint,
        completionRate,
        metrics
      });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch sprint summary' });
    }
  });

  fastify.put('/:sprintId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sprintId } = request.params as any;
      const updateData = request.body as any;
      const sprint = await Sprint.findByIdAndUpdate(
        sprintId,
        { $set: updateData },
        { new: true }
      );
      if (!sprint) {
        return reply.code(404).send({ error: 'Sprint not found' });
      }
      return reply.code(200).send(sprint);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update sprint' });
    }
  });

  fastify.put('/:sprintId/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sprintId } = request.params as any;
      const { status } = request.body as any;
      const sprint = await Sprint.findByIdAndUpdate(
        sprintId,
        { $set: { status } },
        { new: true }
      );
      if (!sprint) {
        return reply.code(404).send({ error: 'Sprint not found' });
      }
      return reply.code(200).send(sprint);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update sprint status' });
    }
  });

  fastify.delete('/:sprintId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sprintId } = request.params as any;
      const sprint = await Sprint.findByIdAndDelete(sprintId);
      if (!sprint) {
        return reply.code(404).send({ error: 'Sprint not found' });
      }
      return reply.code(200).send({ success: true });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to delete sprint' });
    }
  });
};
