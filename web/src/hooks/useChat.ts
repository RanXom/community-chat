import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import {
  createChannel as createChannelApi,
  deleteChannel as deleteChannelApi,
  getChannels,
  getMessages,
  joinChannel,
  leaveChannel as leaveChannelApi,
  updateChannel as updateChannelApi,
  updateProfile as updateProfileApi,
  updateMessage as updateMessageApi,
  deleteMessage as deleteMessageApi,
} from '../services/api';
import { createSocket } from '../services/socket';
import type { Channel, Message, User } from '../types';

export type ChatState = {
  channels: Channel[];
  channel: Channel | null;
  messages: Message[];
  input: string;
  typingUser: string | null;
  chatError: string;
  editingMessage: Message | null;
  selectChannel: (channel: Channel) => Promise<void>;
  sendMessage: () => void;
  handleInput: (value: string) => void;
  createChannel: (name: string, description?: string) => Promise<Channel>;
  deleteChannel: (channelId: string) => Promise<void>;
  updateChannel: (
    channelId: string,
    data: { name?: string; description?: string },
  ) => Promise<Channel>;
  leaveChannel: (channelId: string) => Promise<void>;
  updateProfile: (data: { username: string; email: string }) => Promise<User>;
  updateMessage: (messageId: string, content: string) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
  setEditingMessage: (message: Message | null) => void;
  cancelEdit: () => void;
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function sendErrorText(message: string): string {
  switch (message) {
    case 'Too many messages':
      return "Message not sent — you're sending messages too quickly. Please wait a few seconds.";
    case 'Channel membership required':
      return 'Message not sent — you are no longer a member of this channel.';
    case 'User is muted':
      return 'Message not sent — you are muted in this channel.';
    case 'Invalid message':
      return 'Message not sent — the message is invalid.';
    default:
      return 'Message not sent.';
  }
}

export function useChat(token: string, currentUser: User | null): ChatState {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [, setOnlineUsers] = useState<Set<string>>(new Set());
  const [chatError, setChatError] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const [editingMessage, setEditingMessageState] = useState<Message | null>(null);

  useEffect(() => {
    if (!token) return;

    let alive = true;

    getChannels(token)
      .then((data) => {
        if (alive) setChannels(data.channels);
      })
      .catch((err) => {
        if (alive) setChatError(errorMessage(err, 'Failed to load channels'));
      });

    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let alive = true;

    const refresh = async () => {
      if (!alive) return;
      if (document.visibilityState === 'visible') {
        try {
          const data = await getChannels(token);
          if (alive) setChannels(data.channels);
        } catch {
          // silent fail - channels will update on next user action
        }
      }
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      alive = false;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [token]);

  useEffect(() => {
    if (!token || !channel) return;

    let alive = true;

    getMessages(token, channel.id)
      .then((data) => {
        if (alive) setMessages([...data.items].reverse());
      })
      .catch((err) => {
        if (alive) setChatError(errorMessage(err, 'Failed to load messages'));
      });

    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_channel', channel.id);
    });

    socket.on('message_created', (message: Message) => {
      if (message.user.id === currentUser?.id) {
        setMessages((current) => {
          const index = current.findIndex(
            (item) =>
              item.status === 'sending' &&
              item.user.id === currentUser.id &&
              item.content === message.content,
          );

          if (index === -1) return current;

          const next = [...current];
          next[index] = { ...message, status: 'sent' };
          return next;
        });
        return;
      }

      setMessages((current) => [...current, message]);
    });

    socket.on('user_typing', (data: { username: string }) => {
      setTypingUser(data.username);
    });

    socket.on('user_stopped_typing', () => {
      setTypingUser(null);
    });

    socket.on('user_online', (data: { userId: string }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        next.add(data.userId);
        return next;
      });
    });

    socket.on('user_offline', (data: { userId: string }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        next.delete(data.userId);
        return next;
      });
    });

    socket.on('error', (data: { message?: string }) => {
      const errorText = sendErrorText(data.message ?? '');

      setMessages((current) => {
        const index = current.findLastIndex((item) => item.status === 'sending');

        if (index === -1) return current;

        const next = [...current];
        next[index] = { ...next[index], status: 'failed', errorText };
        return next;
      });

      setChatError(data.message ?? 'Socket error');
    });

    socket.on('channel_membership_added', () => {
      getChannels(token)
        .then((data) => setChannels(data.channels))
        .catch(() => undefined);
    });

    return () => {
      alive = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, channel, currentUser?.id]);

  async function selectChannel(nextChannel: Channel) {
    setChatError('');

    try {
      await joinChannel(token, nextChannel.id);
      setChannel(nextChannel);
    } catch (err) {
      setChatError(errorMessage(err, 'Failed to join channel'));
    }
  }

  function sendMessage() {
    const content = input.trim();

    if (!content || !socketRef.current || !channel || !currentUser) return;

    socketRef.current.emit('send_message', {
      channelId: channel.id,
      content,
    });

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: currentUser.id,
          username: currentUser.username,
        },
        status: 'sending',
      },
    ]);

    socketRef.current.emit('typing_stop', channel.id);
    setInput('');
  }

  function handleInput(value: string) {
    setInput(value);

    if (!socketRef.current || !channel) return;

    socketRef.current.emit(value.trim() ? 'typing_start' : 'typing_stop', channel.id);
  }

  async function createChannel(name: string, description?: string) {
    const created = await createChannelApi(token, name, description);

    const data = await getChannels(token);
    setChannels(data.channels);

    return created.channel;
  }

  async function deleteChannel(channelId: string) {
    await deleteChannelApi(token, channelId);

    setChannels((current) => current.filter((item) => item.id !== channelId));

    if (channel?.id === channelId) {
      setChannel(null);
      setMessages([]);
    }
  }

  async function updateChannel(channelId: string, data: { name?: string; description?: string }) {
    const { channel: updated } = await updateChannelApi(token, channelId, data);

    setChannels((current) =>
      current.map((item) =>
        item.id === updated.id ? { ...item, name: updated.name, description: updated.description } : item,
      ),
    );

    setChannel((current) =>
      current?.id === updated.id
        ? { ...current, name: updated.name, description: updated.description }
        : current,
    );

    return updated;
  }

  async function leaveChannel(channelId: string) {
    await leaveChannelApi(token, channelId);

    setChannels((current) => current.filter((item) => item.id !== channelId));

    if (channel?.id === channelId) {
      setChannel(null);
      setMessages([]);
    }
  }

  async function updateProfile(data: { username: string; email: string }) {
    const { user } = await updateProfileApi(token, data);
    return user;
  }

  async function updateMessage(messageId: string, content: string) {
    const { message } = await updateMessageApi(token, messageId, content);
    setMessages((current) =>
      current.map((msg) => (msg.id === messageId ? { ...msg, content: message.content, updatedAt: message.updatedAt } : msg)),
    );
    return message;
  }

  async function deleteMessage(messageId: string) {
    await deleteMessageApi(token, messageId);
    setMessages((current) => current.filter((msg) => msg.id !== messageId));
  }

  function setEditingMessage(message: Message | null) {
    setEditingMessageState(message);
    if (message) {
      setInput(message.content);
    }
  }

  function cancelEdit() {
    setEditingMessageState(null);
    setInput('');
  }

  return {
    channels,
    channel,
    messages,
    input,
    typingUser,
    chatError,
    editingMessage,
    selectChannel,
    sendMessage,
    handleInput,
    createChannel,
    deleteChannel,
    updateChannel,
    leaveChannel,
    updateProfile,
    updateMessage,
    deleteMessage,
    setEditingMessage,
    cancelEdit,
  };
}