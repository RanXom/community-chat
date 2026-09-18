import type { RequestHandler } from 'express';
import { loginUser, refreshAccessToken, registerUser } from './auth.service.js';

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

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const result = await loginUser(req.body.email, req.body.password);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const refreshController: RequestHandler = async (req, res, next) => {
  try {
    const result = await refreshAccessToken(req.body.refreshToken);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
