import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';

import { createChannelSchema, channelIdSchema } from './channel.schema.js';

import {
  createChannelController,
  deleteChannelController,
  getChannelController,
  joinChannelController,
  leaveChannelController,
  listChannelsController,
  listMembersController,
} from './channel.controller.js';

export const channelRouter = Router();

channelRouter.get('/', requireAuth, listChannelsController);

channelRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  validate(createChannelSchema),
  createChannelController,
);

channelRouter.get('/:channelId', requireAuth, validate(channelIdSchema), getChannelController);

channelRouter.post(
  '/:channelId/join',
  requireAuth,
  validate(channelIdSchema),
  joinChannelController,
);

channelRouter.delete(
  '/:channelId/leave',
  requireAuth,
  validate(channelIdSchema),
  leaveChannelController,
);

channelRouter.get(
  '/:channelId/members',
  requireAuth,
  validate(channelIdSchema),
  listMembersController,
);

channelRouter.delete(
  '/:channelId',
  requireAuth,
  requireRole('ADMIN'),
  validate(channelIdSchema),
  deleteChannelController,
);
