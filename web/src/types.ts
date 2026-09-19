export type User = {
  id: string;
  username: string;
  email?: string;
  role?: 'ADMIN' | 'MODERATOR' | 'MEMBER';
};

export type Channel = {
  id: string;
  name: string;
  description?: string | null;
};

export type ChannelMember = {
  joinedAt: string;
  mutedUntil: string | null;
  user: {
    id: string;
    username: string;
    role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  };
};

export type Message = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
  status?: 'sending' | 'sent' | 'failed';
  errorText?: string;
};

export type AuthMode = 'login' | 'register';

export type SocketError = {
  message?: string;
};