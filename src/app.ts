import express from 'express';
import cors from 'cors';

import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './api/health/health.routes.js';
import { requestLogger } from './middleware/request-logger.js';
import { authRouter } from './api/auth/auth.routes.js';
import { channelRouter } from './api/channels/channel.routes.js';
import { messageRouter } from './api/messages/message.routes.js';
import { env } from './config/env.js';

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
  }),
);

app.use(requestLogger);
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/channels', channelRouter);
app.use('/api', messageRouter);

app.use(errorHandler);

export default app;
