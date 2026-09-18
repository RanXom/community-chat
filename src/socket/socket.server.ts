import type { createServer } from 'node:http';
import { Server } from 'socket.io';
import { authenticateSocket } from './socket.auth.js';
import { registerRoomHandlers } from './socket.rooms.js';
import { sendMessageSchema } from '../api/messages/message.schema.js';
import { createMessage } from '../api/messages/message.service.js';
import { AppError } from '../utils/app-error.js';
import { addConnection, removeConnection } from './socket.presence.js';
import { registerTypingHandlers } from './socket.typing.js';

export function createSocketServer(httpServer: ReturnType<typeof createServer>): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);

      socket.data.user = user;

      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    const becameOnline = addConnection(user.id);

    if (becameOnline) {
      io.emit('user_online', {
        userId: user.id,
      });
    }

    console.log(`socket connected: ${socket.id} user=${user.id}`);

    registerRoomHandlers(io, socket);
    registerTypingHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      const becameOffline = removeConnection(user.id);

      if (becameOffline) {
        io.emit('user_offline', {
          userId: user.id,
        });
      }

      console.log(`socket disconnected: ${socket.id} reason=${reason}`);
    });

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
  });

  return io;
}
