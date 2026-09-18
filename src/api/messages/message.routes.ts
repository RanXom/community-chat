import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { listMessagesController } from './message.controller.js';

export const messageRouter = Router();

messageRouter.get('/channels/:channelId/messages', requireAuth, listMessagesController);
