import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Notification } from '../models/Notification';
import { authenticate } from '../middlewares/auth';

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  // GET /api/notifications
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { isRead, is_read } = request.query as any;
      const filter: any = { userId: request.user?.id };
      
      const readParam = isRead !== undefined ? isRead : is_read;
      if (readParam !== undefined) {
        filter.isRead = readParam === 'true';
      }

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const transformed = notifications.map(n => ({
        ...n,
        id: n._id
      }));

      return reply.code(200).send(transformed);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch notifications', details: err.message });
    }
  });

  // GET /api/notifications/unread-count
  fastify.get('/unread-count', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const count = await Notification.countDocuments({
        userId: request.user?.id,
        isRead: false
      });
      return reply.code(200).send({ count });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch unread count', details: err.message });
    }
  });

  // PUT /api/notifications/:id/read
  fastify.put('/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: request.user?.id },
        { isRead: true, updatedAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return reply.code(404).send({ error: 'Notification not found' });
      }

      return reply.code(200).send({ success: true });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to mark as read', details: err.message });
    }
  });

  // PUT /api/notifications/read-all
  fastify.put('/read-all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await Notification.updateMany(
        { userId: request.user?.id, isRead: false },
        { isRead: true, updatedAt: new Date() }
      );
      return reply.code(200).send({ success: true });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to mark all as read', details: err.message });
    }
  });
}
