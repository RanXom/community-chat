import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { listMessagesController, updateMessageController, deleteMessageController } from './message.controller.js';

export const messageRouter = Router();

messageRouter.get('/channels/:channelId/messages', requireAuth, listMessagesController);
messageRouter.patch('/messages/:messageId', requireAuth, updateMessageController);
messageRouter.delete('/messages/:messageId', requireAuth, deleteMessageController);
