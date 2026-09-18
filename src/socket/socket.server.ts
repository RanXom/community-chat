import type { createServer } from 'node:http';
import { Server } from 'socket.io';
import { authenticateSocket } from './socket.auth.js';

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

    console.log(`socket connected: ${socket.id} user=${user.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`socket disconnected: ${socket.id} reason=${reason}`);
    });
  });

  return io;
}
