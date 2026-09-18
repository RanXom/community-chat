import type { Socket } from 'socket.io';
import type { SocketUser } from './socket.types.js';
import { verifyAccessToken } from '../api/auth/jwt.js';

export async function authenticateSocket(socket: Socket): Promise<SocketUser> {
  const token = socket.handshake.auth?.token;

  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Authentication required');
  }

  const payload = await verifyAccessToken(token);

  return {
    id: payload.sub,
    role: payload.role,
  };
}
