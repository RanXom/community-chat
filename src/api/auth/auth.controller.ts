import type { RequestHandler } from 'express';
import { registerUser } from './auth.service.js';

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const user = await registerUser(req.body.username, req.body.email, req.body.password);

    res.status(201).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};
