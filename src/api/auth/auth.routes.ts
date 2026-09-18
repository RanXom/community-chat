import { Router } from 'express';

import { loginSchema, refreshSchema, registerSchema } from './auth.schema.js';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), registerController);
authRouter.post('/login', validate(loginSchema), loginController);
authRouter.post('/refresh', validate(refreshSchema), refreshController);
authRouter.post('/logout', validate(refreshSchema), logoutController);

authRouter.get('/me', requireAuth, meController);
