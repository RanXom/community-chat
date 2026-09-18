import { prisma } from '../../prisma/client.js';
import { hashPassword } from '../../utils/password.js';

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
    throw new Error('Username or email already exists');
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
