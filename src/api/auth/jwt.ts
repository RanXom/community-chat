import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { env } from '../../config/env.js';

const secret = new TextEncoder().encode(env.jwt.secret);

const algorithm = 'HS256';

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
}

export async function signAccessToken(
  userId: string,
  role: AccessTokenPayload['role'],
): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: algorithm, typ: 'JWT' })
    .setSubject(userId)
    .setIssuer(env.jwt.issuer)
    .setAudience(env.jwt.audience)
    .setIssuedAt()
    .setExpirationTime(env.jwt.accessTokenTtl)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [algorithm],
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
  });

  if (
    typeof payload.sub !== 'string' ||
    !['ADMIN', 'MODERATOR', 'MEMBER'].includes(String(payload.role))
  ) {
    throw new Error('Invalid access token');
  }

  return payload as AccessTokenPayload;
}
