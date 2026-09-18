import type { Server, Socket } from 'socket.io';

import { isChannelMember } from '../api/channels/channel.service.js';

export function registerRoomHandlers(_io: Server, socket: Socket): void {
  socket.on('join_channel', async (channelId: unknown) => {
    if (typeof channelId !== 'string') {
      socket.emit('error', {
        message: 'Invalid channel ID',
      });
      return;
    }

    try {
      const user = socket.data.user;

      const member = await isChannelMember(user.id, channelId);

      if (!member) {
        socket.emit('error', {
          message: 'Channel membership required',
        });
        return;
      }

      await socket.join(channelId);

      socket.emit('channel_joined', {
        channelId,
      });
    } catch {
      socket.emit('error', {
        message: 'Failed to join channel',
      });
    }
  });

  socket.on('leave_channel', async (channelId: unknown) => {
    if (typeof channelId !== 'string') {
      socket.emit('error', {
        message: 'Invalid channel ID',
      });
      return;
    }

    await socket.leave(channelId);

    socket.emit('channel_left', {
      channelId,
    });
  });
}
