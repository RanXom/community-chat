import { describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';

import { env } from '../../config/env.js';
import { signAccessToken, verifyAccessToken } from './jwt.js';

const secret = new TextEncoder().encode(env.jwt.secret);

describe('jwt access token', () => {
  const userId = 'user-123';
  const role = 'MEMBER' as const;

  it('signs and verifies a valid access token', async () => {
    const token = await signAccessToken(userId, role);

    const payload = await verifyAccessToken(token);

    expect(payload.sub).toBe(userId);
    expect(payload.role).toBe(role);
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('shitty-shit')).rejects.toThrow();
  });

  it('rejects a token signed with the wrong secret', async () => {
    const wrongSecret = new TextEncoder().encode('a'.repeat(64));

    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(env.jwt.issuer)
      .setAudience(env.jwt.audience)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(wrongSecret);

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects a token with the wrong issuer', async () => {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer('wrong-issuer')
      .setAudience(env.jwt.audience)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects a token with the wrong audience', async () => {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(env.jwt.issuer)
      .setAudience('wrong-audience')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(env.jwt.issuer)
      .setAudience(env.jwt.audience)
      .setIssuedAt()
      .setExpirationTime('0s')
      .sign(secret);

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects a token using an unsupported algorithm', async () => {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS384', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(env.jwt.issuer)
      .setAudience(env.jwt.audience)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});
