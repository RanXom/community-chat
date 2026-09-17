import type { ErrorRequestHandler } from 'express';

import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });

    return;
  }

  console.error(err);

  res.status(500).json({
    error: 'Internal server error',
  });
};
