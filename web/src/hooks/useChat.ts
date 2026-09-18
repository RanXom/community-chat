import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { getChannels, getMessages, joinChannel } from '../services/api';
import { createSocket } from '../services/socket';
import type { Channel, Message, User } from '../types';

export type ChatState = {
  channels: Channel[];
  channel: Channel | null;
  messages: Message[];
  input: string;
  typingUser: string | null;
  chatError: string;
  selectChannel: (channel: Channel) => Promise<void>;
  sendMessage: () => void;
  handleInput: (value: string) => void;
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
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
      if (message.user.id !== currentUser?.id) {
        setMessages((current) => [...current, message]);
      }
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
      setChatError(data.message ?? 'Socket error');
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

  return {
    channels,
    channel,
    messages,
    input,
    typingUser,
    chatError,
    selectChannel,
    sendMessage,
    handleInput,
  };
}