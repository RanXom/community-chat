import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './prisma/client.js';
import { createSocketServer } from './socket/socket.server.js';

const port = env.port;

async function start(): Promise<void> {
  await prisma.$connect();

  const server = createServer(app);
  createSocketServer(server);

  server.listen(port, '0.0.0.0', () => {
    console.log(`community-chat is listening at ${port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`received ${signal}, shutting down`);

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGNINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

start().catch((error: unknown) => {
  console.error('failed to start server', error);
  process.exitCode = 1;
});
