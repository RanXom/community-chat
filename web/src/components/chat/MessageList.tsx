import { useLayoutEffect, useRef, useState } from 'react';
import type { Channel, Message } from '../../types';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';

const SCROLL_THRESHOLD = 80;

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
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevChannelId, setPrevChannelId] = useState(channel?.id);
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);

  const channelId = channel?.id;

  if (channelId !== prevChannelId) {
    setPrevChannelId(channelId);
    setPrevMessageCount(messages.length);
    setAtBottom(true);
    setUnseenCount(0);
  } else if (messages.length !== prevMessageCount) {
    setPrevMessageCount(messages.length);

    if (messages.length > prevMessageCount) {
      const lastMessage = messages[messages.length - 1];
      const isOwn = lastMessage?.user.id === currentUserId;

      if (isOwn || atBottom) {
        setUnseenCount(0);
      } else {
        setUnseenCount((count) => count + (messages.length - prevMessageCount));
      }
    } else {
      setAtBottom(true);
      setUnseenCount(0);
    }
  }

  const lastMessageIsOwn = messages[messages.length - 1]?.user.id === currentUserId;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;

    if (atBottom || lastMessageIsOwn) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, channelId, atBottom, lastMessageIsOwn, typingUser]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;

    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD;

    if (nearBottom !== atBottom) {
      setAtBottom(nearBottom);

      if (nearBottom) {
        setUnseenCount(0);
      }
    }
  }

  function jumpToLatest() {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
    setAtBottom(true);
    setUnseenCount(0);
  }

  return (
    <div className="messages-container">
      <div
        className="messages"
        ref={containerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
      >
        {!channel && <p className="dim">&gt; select a channel to begin</p>}

        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {typingUser && typingUser !== currentUserId && <TypingIndicator username={typingUser} />}
      </div>

      {unseenCount > 0 && (
        <button className="new-messages-button" onClick={jumpToLatest}>
          ↓ {unseenCount} new {unseenCount === 1 ? 'message' : 'messages'}
        </button>
      )}
    </div>
  );
}

export default MessageList;