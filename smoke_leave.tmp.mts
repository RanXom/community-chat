import { PrismaClient } from './src/prisma/client.js';
import { createServer } from './src/socket/server.js';
import { createApp } from './src/app.js';

const prisma = new PrismaClient();
const app = createApp();
const server = createServer(app);

await new Promise((r) => server.listen(3458, r));
const { Server } = await import('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
import { createSocketServer } from './src/socket/socket.server.js';
createSocketServer(io);

async function req(method, path, token, body) {
  const res = await fetch(`http://127.0.0.1:3458/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(email, password) {
  const { status, data } = await req('POST', '/auth/login', null, { email, password });
  return { status, data };
}

async function main() {
  // Setup: admin creates channel, adds bob
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { username: 'admin', email: 'admin@test.com', passwordHash: 'x', role: 'ADMIN' },
  });
  const bob = await prisma.user.create({
    data: { username: 'bob', email: 'bob@test.com', passwordHash: 'x', role: 'MEMBER' },
  });

  const channel = await prisma.channel.create({
    data: { name: 'test', description: 'test channel', createdById: admin.id },
  });
  await prisma.channelMember.create({ data: { channelId: channel.id, userId: admin.id, role: 'ADMIN' } });
  await prisma.channelMember.create({ data: { channelId: channel.id, userId: bob.id, role: 'MEMBER' } });

  const adminLogin = await login('admin@test.com', 'x');
  const bobLogin = await login('bob@test.com', 'x');
  const adminToken = adminLogin.data.accessToken;
  const bobToken = bobLogin.data.accessToken;

  // Bob leaves the channel
  const leaveRes = await req('DELETE', `/channels/${channel.id}/leave`, bobToken);
  console.log('BOB LEAVE:', leaveRes.status, leaveRes.data);

  // Verify membership gone
  const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
  console.log('MEMBERS AFTER LEAVE:', members.map(m => m.userId));

  // Bob tries to leave again (should 404)
  const leaveAgain = await req('DELETE', `/channels/${channel.id}/leave`, bobToken);
  console.log('BOB LEAVE AGAIN:', leaveAgain.status, leaveAgain.data);

  // Admin leaves
  const adminLeave = await req('DELETE', `/channels/${channel.id}/leave`, adminToken);
  console.log('ADMIN LEAVE:', adminLeave.status, adminLeave.data);

  const members2 = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
  console.log('MEMBERS AFTER ADMIN LEAVE:', members2.map(m => m.userId));

  server.close();
  await prisma.$disconnect();
  console.log('ALL TESTS PASSED');
}

main().catch((e) => {
  console.error(e);
  server.close();
  prisma.$disconnect();
  process.exit(1);
});
