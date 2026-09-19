import { useState, type FormEvent } from 'react';

import { login, register } from '../services/api';
import type { AuthMode, User } from '../types';

export type AuthState = {
  token: string;
  user: User | null;
  mode: AuthMode;
  username: string;
  email: string;
  password: string;
  authError: string;
  setUsername: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  handleAuth: (event: FormEvent) => void;
  toggleMode: () => void;
  logout: () => void;
};

export function useAuth(): AuthState {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') ?? '');
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setAuthError('');

    try {
      if (mode === 'register') {
        await register(username, email, password);

        setMode('login');
        setPassword('');
        setAuthError('Registration successful. Login below.');
        return;
      }

      const result = await login(email, password);

      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      setToken(result.accessToken);
      setUser(result.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setAuthError('');
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  }

  return {
    token,
    user,
    mode,
    username,
    email,
    password,
    authError,
    setUsername,
    setEmail,
    setPassword,
    handleAuth,
    toggleMode,
    logout,
  };
}