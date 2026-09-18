import { Router } from 'express';

import { loginSchema, refreshSchema, registerSchema } from './auth.schema.js';
import { loginController, refreshController, registerController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), registerController);
authRouter.post('/login', validate(loginSchema), loginController);
authRouter.post('/refresh', validate(refreshSchema), refreshController);
