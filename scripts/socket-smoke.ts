import { io } from 'socket.io-client';

const token = process.env.SOCKET_TOKEN;

if (!token) {
  throw new Error('SOCKET_TOKEN is required');
}

const socket = io('http://127.0.0.1:3000', {
  auth: {
    token,
  },
});

socket.on('connect', () => {
  console.log(`connected: ${socket.id}`);
  socket.disconnect();
});

socket.on('connect_error', (error) => {
  console.error(`connection rejected: ${error.message}`);
  process.exitCode = 1;
});
