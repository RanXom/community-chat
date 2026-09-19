import { Router } from 'express';

import { loginSchema, refreshSchema, registerSchema, updateProfileSchema } from './auth.schema.js';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  updateProfileController,
} from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), registerController);
authRouter.post('/login', validate(loginSchema), loginController);
authRouter.post('/refresh', validate(refreshSchema), refreshController);
authRouter.post('/logout', validate(refreshSchema), logoutController);

authRouter.get('/me', requireAuth, meController);
authRouter.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfileController);

authRouter.get('/admin-test', requireAuth, requireRole('ADMIN'), (_req, res) => {
  res.status(200).json({ message: 'admin access granted' });
});
authRouter.get('/moderator-test', requireAuth, requireRole('MODERATOR'), (_req, res) => {
  res.status(200).json({ message: 'moderator access granted' });
});
authRouter.get('/member-test', requireAuth, requireRole('MEMBER'), (_req, res) => {
  res.status(200).json({ message: 'member access granted' });
});
