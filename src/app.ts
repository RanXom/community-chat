import express from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './api/health/health.routes.js';
import { requestLogger } from './middleware/request-logger.js';

const app = express();

app.use(requestLogger);
app.use(express.json());

app.use('/health', healthRouter);

app.use(errorHandler);

export default app;
