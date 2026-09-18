import { io, type Socket } from 'socket.io-client';

export function createSocket(token: string): Socket {
  return io('http://127.0.0.1:3000', {
    auth: {
      token,
    },
  });
}
