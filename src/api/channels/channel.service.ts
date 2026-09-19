import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/app-error.js';

export async function listChannels() {
  return prisma.channel.findMany({
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });
}

export async function createChannel(name: string, description?: string) {
  const existing = await prisma.channel.findUnique({
    where: { name },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(409, 'Channel already exists');
  }

  return prisma.channel.create({
    data: {
      name,
      description: description ?? null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  });
}

export async function getChannel(channelId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!channel) {
    throw new AppError(404, 'Channel not found');
  }

  return channel;
}

export async function joinChannel(userId: string, channelId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true },
  });

  if (!channel) {
    throw new AppError(404, 'Channel not found');
  }

  await prisma.channelMember.upsert({
    where: {
      userId_channelId: {
        userId,
        channelId,
      },
    },
    create: {
      userId,
      channelId,
    },
    update: {},
  });
}

export async function leaveChannel(userId: string, channelId: string) {
  const result = await prisma.channelMember.deleteMany({
    where: {
      userId,
      channelId,
    },
  });

  if (result.count === 0) {
    throw new AppError(404, 'Channel membership not found');
  }
}

export async function listMembers(channelId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true },
  });

  if (!channel) {
    throw new AppError(404, 'Channel not found');
  }

  return prisma.channelMember.findMany({
    where: { channelId },
    orderBy: {
      joinedAt: 'asc',
    },
    select: {
      joinedAt: true,
      mutedUntil: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });
}

export async function updateChannel(
  channelId: string,
  data: { name?: string; description?: string | null },
) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, name: true },
  });

  if (!channel) {
    throw new AppError(404, 'Channel not found');
  }

  if (data.name && data.name !== channel.name) {
    const existing = await prisma.channel.findUnique({
      where: { name: data.name },
      select: { id: true },
    });

    if (existing) {
      throw new AppError(409, 'Channel already exists');
    }
  }

  return prisma.channel.update({
    where: { id: channelId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  });
}

export async function addMember(channelId: string, identifier: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!channel) {
    throw new AppError(404, 'Channel not found');
  }

  const target = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
    select: { id: true },
  });

  if (!target) {
    throw new AppError(404, 'User not found');
  }

  const existing = await prisma.channelMember.findUnique({
    where: {
      userId_channelId: {
        userId: target.id,
        channelId,
      },
    },
    select: { userId: true },
  });

  if (existing) {
    throw new AppError(409, 'Already a member');
  }

  const member = await prisma.channelMember.create({
    data: {
      userId: target.id,
      channelId,
    },
    select: {
      joinedAt: true,
      mutedUntil: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });

  return { member, channel };
}

export async function deleteChannel(channelId: string) {
  const result = await prisma.channel.deleteMany({
    where: { id: channelId },
  });

  if (result.count === 0) {
    throw new AppError(404, 'Channel not found');
  }
}

export async function isChannelMember(userId: string, channelId: string): Promise<boolean> {
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

  return membership !== null;
}
