import type { Channel, Message } from '../../types';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';

function MessageList({
  channel,
  messages,
  typingUser,
  currentUserId,
}: {
  channel: Channel | null;
  messages: Message[];
  typingUser: string | null;
  currentUserId: string | undefined;
}) {
  return (
    <div className="messages">
      {!channel && <p className="dim">&gt; select a channel to begin</p>}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {typingUser && typingUser !== currentUserId && <TypingIndicator username={typingUser} />}
    </div>
  );
}

export default MessageList;