import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import {
  getChannels,
  getMessages,
  joinChannel,
  login,
  register,
  type Channel,
  type Message,
  type User,
} from './api';
import { createSocket } from './socket';

type AuthMode = 'login' | 'register';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') ?? '');
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [_onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    getChannels(token)
      .then((data) => setChannels(data.channels))
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!token || !channel) return;

    let alive = true;

    getMessages(token, channel.id)
      .then((data) => {
        if (alive) setMessages(data.items.reverse());
      })
      .catch((err) => setError(err.message));

    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_channel', channel.id);
    });

    socket.on('message_created', (message: Message) => {
      if (message.user.id !== user?.id) {
        setMessages((current) => [...current, message]);
      }
    });

    socket.on('user_typing', (data) => {
      setTypingUser(data.username);
    });

    socket.on('user_stopped_typing', () => {
      setTypingUser(null);
    });

    socket.on('user_online', (data) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        next.add(data.userId);
        return next;
      });
    });

    socket.on('user_offline', (data) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        next.delete(data.userId);
        return next;
      });
    });

    socket.on('error', (data) => {
      setError(data.message ?? 'Socket error');
    });

    return () => {
      alive = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, channel, user?.id]);

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        await register(username, email, password);

        setMode('login');
        setPassword('');
        setError('Registration successful. Login below.');
        return;
      }

      const result = await login(email, password);

      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      setToken(result.accessToken);
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  async function selectChannel(nextChannel: Channel) {
    setError('');

    try {
      await joinChannel(token, nextChannel.id);
      setChannel(nextChannel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join channel');
    }
  }

  function sendMessage() {
    const content = input.trim();

    if (!content || !socketRef.current || !channel) return;

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
          id: user!.id,
          username: user!.username,
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

  function logout() {
    socketRef.current?.disconnect();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setChannel(null);
    setMessages([]);
  }

  if (!token) {
    return (
      <main className="auth">
        <div className="terminal">
          <header>
            <span>COMMUNITY_CHAT</span>
            <span>v0.1.0</span>
          </header>

          <div className="auth-body">
            <p className="dim">&gt; authentication required</p>

            <h1>{mode === 'login' ? 'LOGIN' : 'REGISTER'}</h1>

            <form onSubmit={handleAuth}>
              {mode === 'register' && (
                <label>
                  USERNAME
                  <input value={username} onChange={(e) => setUsername(e.target.value)} required />
                </label>
              )}

              <label>
                EMAIL
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                PASSWORD
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && <p className="error">! {error}</p>}

              <button type="submit">[{mode === 'login' ? ' LOGIN ' : ' REGISTER '}]</button>
            </form>

            <button
              className="link-button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              &gt; {mode === 'login' ? 'register new user' : 'back to login'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="chat">
      <aside className="sidebar terminal">
        <header>CHANNELS</header>

        <div className="channel-list">
          {channels.map((item) => (
            <button
              key={item.id}
              className={channel?.id === item.id ? 'active' : ''}
              onClick={() => selectChannel(item)}
            >
              &gt; #{item.name}
            </button>
          ))}
        </div>

        <footer>
          <span>{user?.username}</span>
          <button className="link-button" onClick={logout}>
            logout
          </button>
        </footer>
      </aside>

      <section className="chat-window terminal">
        <header>
          <span>{channel ? `# ${channel.name}` : 'SELECT CHANNEL'}</span>
          <span className="online">● CONNECTED</span>
        </header>

        <div className="messages">
          {!channel && <p className="dim">&gt; select a channel to begin</p>}

          {messages.map((message) => (
            <article key={message.id}>
              <div>
                <strong>{message.user.username}</strong>
                <span className="timestamp">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p>{message.content}</p>
            </article>
          ))}

          {typingUser && typingUser !== user?.username && (
            <p className="typing">&gt; {typingUser} is typing...</p>
          )}
        </div>

        {channel && (
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <span>&gt;</span>
            <input
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="type message..."
              autoFocus
            />
          </form>
        )}
      </section>
    </main>
  );
}

export default App;
