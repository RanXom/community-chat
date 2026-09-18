import type { RequestHandler } from 'express';

import {
  createChannel,
  getChannel,
  joinChannel,
  leaveChannel,
  listChannels,
  listMembers,
} from './channel.service.js';
import { AppError } from '../../utils/app-error.js';

function getChannelId(req: Parameters<RequestHandler>[0]): string {
  const channelId = req.params.channelId;

  if (typeof channelId !== 'string') {
    throw new AppError(400, 'Invalid channel ID');
  }

  return channelId;
}

export const listChannelsController: RequestHandler = async (_req, res, next) => {
  try {
    const channels = await listChannels();

    res.status(200).json({ channels });
  } catch (error) {
    next(error);
  }
};

export const createChannelController: RequestHandler = async (req, res, next) => {
  try {
    const channel = await createChannel(req.body.name, req.body.description);

    res.status(201).json({ channel });
  } catch (error) {
    next(error);
  }
};

export const getChannelController: RequestHandler = async (req, res, next) => {
  try {
    const channel = await getChannel(getChannelId(req));

    res.status(200).json({ channel });
  } catch (error) {
    next(error);
  }
};

export const joinChannelController: RequestHandler = async (req, res, next) => {
  try {
    await joinChannel(req.user!.id, getChannelId(req));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const leaveChannelController: RequestHandler = async (req, res, next) => {
  try {
    await leaveChannel(req.user!.id, getChannelId(req));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listMembersController: RequestHandler = async (req, res, next) => {
  try {
    const members = await listMembers(getChannelId(req));

    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
};
