import type { createServer } from 'node:http';
import { Server } from 'socket.io';
import { authenticateSocket } from './socket.auth.js';
import { registerRoomHandlers } from './socket.rooms.js';
import { addConnection, removeConnection } from './socket.presence.js';
import { registerTypingHandlers } from './socket.typing.js';
import { env } from '../config/env.js';
import { registerMessageHandlers } from './socket.messages.js';

export function createSocketServer(httpServer: ReturnType<typeof createServer>): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.frontendUrl,
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

    registerMessageHandlers(io, socket);
  });

  return io;
}
