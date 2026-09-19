import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/app-error.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signAccessToken } from './jwt.js';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.js';

export async function registerUser(username: string, email: string, password: string) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AppError(409, 'Username or email already exists');
  }

  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await verifyPassword(user.passwordHash, password);

  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const accessToken = await signAccessToken(user.id, user.role);

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(Date.now() + parseRefreshTokenTtl(env.jwt.refreshTokenTtl));

  const familyId = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt,
      userId: user.id,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}

function parseRefreshTokenTtl(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);

  if (!match) {
    throw new Error('Invalid refresh token ttl');
  }

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  } as const;

  return value * multipliers[unit as keyof typeof multipliers];
}

export async function refreshAccessToken(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);

  const session = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    throw new AppError(401, 'Invalid refresh token');
  }

  if (session.revokedAt !== null) {
    await prisma.refreshToken.updateMany({
      where: {
        familyId: session.familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    throw new AppError(401, 'Invalid refresh token');
  }

  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

  const expiresAt = new Date(Date.now() + parseRefreshTokenTtl(env.jwt.refreshTokenTtl));

  const accessToken = await signAccessToken(session.user.id, session.user.role);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    }),

    prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        familyId: session.familyId,
        expiresAt,
        userId: session.user.id,
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: session.user,
  };
}

export async function logoutUser(refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
