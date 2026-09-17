import type { RequestHandler } from 'express';
import { z } from 'zod';

import { AppError } from '../utils/app-error.js';

export function validate(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      next(new AppError(400, 'Invalid request'));
      return;
    }

    next();
  };
}
