import type { AccessTokenPayload } from '../api/auth/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: AccessTokenPayload['role'];
    };
  }
}

export {};
