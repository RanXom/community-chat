import type { Channel, Message, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/api';

export type LoginResult = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type ErrorResponse = {
  error?: string;
  message?: string;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (data as ErrorResponse | null)?.error ?? (data as ErrorResponse | null)?.message;

    throw new Error(error ?? 'Request failed');
  }

  return data as T;
}

export function register(username: string, email: string, password: string) {
  return request<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
}

export function login(email: string, password: string) {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function getChannels(token: string) {
  return request<{ channels: Channel[] }>('/channels', {}, token);
}

export function joinChannel(token: string, channelId: string) {
  return request(
    `/channels/${channelId}/join`,
    {
      method: 'POST',
    },
    token,
  );
}

export function getMessages(token: string, channelId: string) {
  return request<{ items: Message[]; nextCursor: string | null }>(
    `/channels/${channelId}/messages?limit=50`,
    {},
    token,
  );
}