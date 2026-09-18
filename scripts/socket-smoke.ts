import { io } from 'socket.io-client';

const token = process.env.SOCKET_TOKEN;
const channelId = process.env.CHANNEL_ID;

if (!token) {
  throw new Error('SOCKET_TOKEN is required');
}

if (!channelId) {
  throw new Error('CHANNEL_ID is required');
}

const socket = io('http://127.0.0.1:3000', {
  auth: {
    token,
  },
});

socket.on('connect', () => {
  console.log(`connected: ${socket.id}`);

  socket.emit('join_channel', channelId);
});

socket.on('channel_joined', (data) => {
  console.log('channel joined:', data);

  socket.emit('send_message', {
    channelId,
    content: 'hello from socket smoke test',
  });
});

socket.on('message_created', (message) => {
  console.log('message created:', message);

  socket.emit('leave_channel', channelId);
});

socket.on('channel_left', (data) => {
  console.log('channel left:', data);
  socket.disconnect();
});

socket.on('error', (error) => {
  console.error('socket error:', error);
  socket.disconnect();
  process.exitCode = 1;
});

socket.on('connect_error', (error) => {
  console.error(`connection rejected: ${error.message}`);
  process.exitCode = 1;
});
