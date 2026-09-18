import { io, type Socket } from 'socket.io-client';

const token = process.env.SOCKET_TOKEN;
const channelA = process.env.CHANNEL_A;
const channelB = process.env.CHANNEL_B;

if (!token || !channelA || !channelB) {
  throw new Error('SOCKET_TOKEN, CHANNEL_A and CHANNEL_B are required');
}

const clientA = io('http://127.0.0.1:3000', {
  auth: { token },
});

const clientB = io('http://127.0.0.1:3000', {
  auth: { token },
});

let aReceived = false;
let bReceived = false;
let completed = false;

function cleanup(socket: Socket): void {
  socket.disconnect();
}

function finish(): void {
  if (completed) return;
  completed = true;

  setTimeout(() => {
    console.log(`client A received: ${aReceived}`);
    console.log(`client B received: ${bReceived}`);

    cleanup(clientA);
    cleanup(clientB);

    if (!aReceived || bReceived) {
      console.error('room isolation FAILED');
      process.exitCode = 1;
      return;
    }

    console.log('room isolation PASSED');
  }, 500);
}

clientA.on('connect', () => {
  console.log(`client A connected: ${clientA.id}`);
  clientA.emit('join_channel', channelA);
});

clientB.on('connect', () => {
  console.log(`client B connected: ${clientB.id}`);
  clientB.emit('join_channel', channelB);
});

clientA.on('channel_joined', (data) => {
  if (data.channelId === channelA) {
    console.log('client A joined channel A');

    clientA.emit('send_message', {
      channelId: channelA,
      content: 'room isolation test',
    });
  }
});

clientB.on('channel_joined', (data) => {
  if (data.channelId === channelB) {
    console.log('client B joined channel B');
  }
});

clientA.on('message_created', (message) => {
  if (message.content === 'room isolation test') {
    aReceived = true;
    console.log('client A received message');
    finish();
  }
});

clientB.on('message_created', (message) => {
  if (message.content === 'room isolation test') {
    bReceived = true;
    console.error('client B received message — BAD');
    finish();
  }
});

clientA.on('connect_error', (error) => {
  console.error(`client A connection failed: ${error.message}`);
  process.exitCode = 1;
});

clientB.on('connect_error', (error) => {
  console.error(`client B connection failed: ${error.message}`);
  process.exitCode = 1;
});
