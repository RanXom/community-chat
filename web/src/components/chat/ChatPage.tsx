import { useState } from 'react';

import type { AuthState } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import ChannelDetailsDialog from '../channels/ChannelDetailsDialog';
import Sidebar from '../channels/Sidebar';
import Composer from './Composer';
import MessageList from './MessageList';

function ChatPage({ auth }: { auth: AuthState }) {
  const chat = useChat(auth.token, auth.user);
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <main className="chat">
      <Sidebar
        user={auth.user}
        channels={chat.channels}
        activeChannel={chat.channel}
        canManageChannels={auth.user?.role === 'ADMIN'}
        onSelectChannel={chat.selectChannel}
        onLogout={auth.logout}
        onCreateChannel={chat.createChannel}
        onDeleteChannel={chat.deleteChannel}
      />

      <section className="chat-window terminal">
        <header>
          <button
            type="button"
            className="channel-title"
            onClick={() => setDetailsOpen(true)}
            disabled={!chat.channel}
            title="Channel details"
          >
            {chat.channel ? `# ${chat.channel.name}` : 'SELECT CHANNEL'}
          </button>
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

      {chat.channel && detailsOpen && (
        <ChannelDetailsDialog
          key={chat.channel.id}
          open
          channel={chat.channel}
          token={auth.token}
          currentUserId={auth.user?.id}
          isAdmin={auth.user?.role === 'ADMIN'}
          onClose={() => setDetailsOpen(false)}
          onChannelUpdated={chat.updateChannel}
          onLeaveChannel={chat.leaveChannel}
        />
      )}
    </main>
  );
}

export default ChatPage;