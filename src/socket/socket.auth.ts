import type { Socket } from 'socket.io';
import type { SocketUser } from './socket.types.js';
import { verifyAccessToken } from '../api/auth/jwt.js';
import { prisma } from '../prisma/client.js';

export async function authenticateSocket(socket: Socket): Promise<SocketUser> {
  const token = socket.handshake.auth?.token;

  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Authentication required');
  }

  const payload = await verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub,
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    username: user.username,
    role: payload.role,
  };
}
