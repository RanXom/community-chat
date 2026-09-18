import type { Server, Socket } from 'socket.io';
import { isChannelMember } from '../api/channels/channel.service.js';

export function registerTypingHandlers(_io: Server, socket: Socket): void {
  socket.on('typing_start', async (channelId: unknown) => {
    if (typeof channelId !== 'string') return;

    const user = socket.data.user;

    if (!(await isChannelMember(user.id, channelId))) return;

    socket.to(channelId).emit('user_typing', {
      userId: user.id,
      username: user.username,
      channelId,
    });
  });

  socket.on('typing_stop', async (channelId: unknown) => {
    if (typeof channelId !== 'string') return;

    const user = socket.data.user;

    if (!(await isChannelMember(user.id, channelId))) return;

    socket.to(channelId).emit('user_stopped_typing', {
      userId: user.id,
      channelId,
    });
  });
}
