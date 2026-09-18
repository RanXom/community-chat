import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/app-error.js';

export async function createMessage(userId: string, channelId: string, content: string) {
  const membership = await prisma.channelMember.findUnique({
    where: {
      userId_channelId: {
        userId,
        channelId,
      },
    },
    select: {
      mutedUntil: true,
    },
  });

  if (!membership) {
    throw new AppError(403, 'Channel membership required');
  }

  if (membership.mutedUntil && membership.mutedUntil > new Date()) {
    throw new AppError(403, 'User is muted');
  }

  return prisma.message.create({
    data: {
      userId,
      channelId,
      content,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
}
