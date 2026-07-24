import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Sprint } from '../models/Sprint';
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
};
