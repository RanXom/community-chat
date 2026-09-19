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

export async function listMessages(userId: string, channelId: string, cursor?: string, limit = 50) {
  const membership = await prisma.channelMember.findUnique({
    where: {
      userId_channelId: {
        userId,
        channelId,
      },
    },
    select: {
      userId: true,
    },
  });

  if (!membership) {
    throw new AppError(403, 'Channel membership required');
  }

  const messages = await prisma.message.findMany({
    where: {
      channelId,
    },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }
      : {}),
    orderBy: {
      createdAt: 'desc',
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

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return {
    items,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

export async function updateMessage(userId: string, messageId: string, content: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      userId: true,
      channelId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });

  if (!message) {
    throw new AppError(404, 'Message not found');
  }

  const membership = await prisma.channelMember.findUnique({
    where: {
      userId_channelId: {
        userId,
        channelId: message.channelId,
      },
    },
    select: {
      user: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!membership) {
    throw new AppError(403, 'Channel membership required');
  }

  const isAuthor = message.userId === userId;
  const requesterRole = membership.user.role;
  const isModeratorOrAdmin = requesterRole === 'MODERATOR' || requesterRole === 'ADMIN';

  if (!isAuthor && !isModeratorOrAdmin) {
    throw new AppError(403, 'Insufficient permissions');
  }

  return prisma.message.update({
    where: { id: messageId },
    data: {
      content,
      updatedAt: new Date(),
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

export async function deleteMessage(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      userId: true,
      channelId: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });

  if (!message) {
    throw new AppError(404, 'Message not found');
  }

  const membership = await prisma.channelMember.findUnique({
    where: {
      userId_channelId: {
        userId,
        channelId: message.channelId,
      },
    },
    select: {
      user: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!membership) {
    throw new AppError(403, 'Channel membership required');
  }

  const isAuthor = message.userId === userId;
  const requesterRole = membership.user.role;
  const isModeratorOrAdmin = requesterRole === 'MODERATOR' || requesterRole === 'ADMIN';

  if (!isAuthor && !isModeratorOrAdmin) {
    throw new AppError(403, 'Insufficient permissions');
  }

  await prisma.message.delete({
    where: { id: messageId },
  });

  return { success: true };
}
