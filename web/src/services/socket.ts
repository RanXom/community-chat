import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://127.0.0.1:3000';

export function createSocket(token: string): Socket {
  return io(SOCKET_URL, {
    auth: { token },
  });
}