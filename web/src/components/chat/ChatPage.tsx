import type { AuthState } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import Sidebar from '../channels/Sidebar';
import Composer from './Composer';
import MessageList from './MessageList';

function ChatPage({ auth }: { auth: AuthState }) {
  const chat = useChat(auth.token, auth.user);

  return (
    <main className="chat">
      <Sidebar
        user={auth.user}
        channels={chat.channels}
        activeChannel={chat.channel}
        onSelectChannel={chat.selectChannel}
        onLogout={auth.logout}
      />

      <section className="chat-window terminal">
        <header>
          <span>{chat.channel ? `# ${chat.channel.name}` : 'SELECT CHANNEL'}</span>
          <span className="online">● CONNECTED</span>
        </header>

        <MessageList
          channel={chat.channel}
          messages={chat.messages}
          typingUser={chat.typingUser}
          currentUserId={auth.user?.id}
        />

        {chat.channel && (
          <Composer value={chat.input} onChange={chat.handleInput} onSend={chat.sendMessage} />
        )}
      </section>
    </main>
  );
}

export default ChatPage;