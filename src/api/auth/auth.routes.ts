import { Router } from 'express';

import { registerSchema } from './auth.schema.js';
import { registerController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), registerController);
