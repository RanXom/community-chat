import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';

import {
  addMemberController,
  createChannelController,
  deleteChannelController,
  getChannelController,
  joinChannelController,
  leaveChannelController,
  listChannelsController,
  listMembersController,
  updateChannelController,
} from './channel.controller.js';

import { createChannelSchema, channelIdSchema, addMemberSchema, updateChannelSchema } from './channel.schema.js';

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

channelRouter.post(
  '/:channelId/members',
  requireAuth,
  requireRole('ADMIN'),
  validate(addMemberSchema),
  addMemberController,
);

channelRouter.patch(
  '/:channelId',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateChannelSchema),
  updateChannelController,
);

channelRouter.delete(
  '/:channelId',
  requireAuth,
  requireRole('ADMIN'),
  validate(channelIdSchema),
  deleteChannelController,
);
