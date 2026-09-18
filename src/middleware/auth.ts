import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { verifyAccessToken } from '../api/auth/jwt.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.header('authorization');

    if (!authorization) {
      throw new AppError(401, 'Authentication required');
    }

    const [schema, token, ...extra] = authorization.split(' ');

    if (schema !== 'Bearer' || !token || extra.length > 0) {
      throw new AppError(401, 'Invalid authorization header');
    }

    const payload = await verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, 'Invalid access token'));
  }
};
