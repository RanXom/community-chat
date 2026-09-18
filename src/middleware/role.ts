import type { RequestHandler } from 'express';
import type { AccessTokenPayload } from '../api/auth/jwt.js';
import { AppError } from '../utils/app-error.js';

export function requireRole(...roles: AccessTokenPayload['role'][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}
