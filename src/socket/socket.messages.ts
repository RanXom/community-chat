import type { Server, Socket } from 'socket.io';
import { sendMessageSchema } from '../api/messages/message.schema.js';
import { createMessage } from '../api/messages/message.service.js';
import { AppError } from '../utils/app-error.js';
import { allowMessages } from './socket.rate-limit.js';

export function registerMessageHandlers(io: Server, socket: Socket): void {
  socket.on('send_message', async (payload: unknown) => {
    try {
      const result = sendMessageSchema.safeParse(payload);

      if (!result.success) {
        socket.emit('error', {
          message: 'Invalid message',
        });
        return;
      }

      const { channelId, content } = result.data;
      const user = socket.data.user;

      if (!allowMessages(user.id)) {
        socket.emit('error', {
          message: 'Too many messages',
        });

        return;
      }

      const message = await createMessage(user.id, channelId, content);

      io.to(channelId).emit('message_created', message);
    } catch (error) {
      if (error instanceof AppError) {
        socket.emit('error', {
          message: error.message,
        });
        return;
      }

      socket.emit('error', {
        message: 'Failed to send message',
      });
    }
  });
}
