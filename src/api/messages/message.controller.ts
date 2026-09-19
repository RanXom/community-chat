import type { RequestHandler } from 'express';

import { listMessages, updateMessage, deleteMessage } from './message.service.js';
import { AppError } from '../../utils/app-error.js';

export const listMessagesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const channelId = req.params.channelId;

    if (typeof channelId !== 'string') {
      throw new AppError(400, 'Invalid channel ID');
    }

    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;

    const result = await listMessages(req.user.id, channelId, cursor, limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateMessageController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const messageId = req.params.messageId;

    if (typeof messageId !== 'string') {
      throw new AppError(400, 'Invalid message ID');
    }

    const content = req.body.content;

    if (typeof content !== 'string') {
      throw new AppError(400, 'Invalid content');
    }

    const message = await updateMessage(req.user.id, messageId, content);

    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const deleteMessageController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const messageId = req.params.messageId;

    if (typeof messageId !== 'string') {
      throw new AppError(400, 'Invalid message ID');
    }

    await deleteMessage(req.user.id, messageId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
