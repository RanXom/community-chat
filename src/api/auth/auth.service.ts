import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/app-error.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signAccessToken } from './jwt.js';

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

  return {
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}
