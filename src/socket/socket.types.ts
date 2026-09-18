import type { AccessTokenPayload } from '../api/auth/jwt.js';

export interface SocketUser {
  id: string;
  username: string;
  role: AccessTokenPayload['role'];
}
