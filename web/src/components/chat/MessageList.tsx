import { useLayoutEffect, useRef, useState } from 'react';
import type { Channel, Message } from '../../types';
import TypingIndicator from './TypingIndicator';

const SCROLL_THRESHOLD = 80;

type MessageGroup = {
  userId: string;
  username: string;
  messages: Message[];
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function MessageGroupItem({
  group,
  currentUserId,
}: {
  group: MessageGroup;
  currentUserId: string | undefined;
}) {
  const isOwn = group.userId === currentUserId;

  const minuteGroups = group.messages.reduce<{ minute: string; messages: Message[] }[]>((acc, message) => {
    const minute = formatTime(new Date(message.createdAt));
    const last = acc[acc.length - 1];
    if (last && last.minute === minute) {
      last.messages.push(message);
    } else {
      acc.push({ minute, messages: [message] });
    }
    return acc;
  }, []);

  return (
    <div className={`message-group ${isOwn ? 'own' : ''}`}>
      <div className="message-group-header">
        <strong>{group.username}</strong>
      </div>
      {minuteGroups.map((mg, idx) => (
        <div key={idx} className="minute-group">
          {mg.messages.map((message, msgIdx) => (
            <div
              key={message.id}
              className={`message-row ${message.status === 'sending' ? 'sending' : message.status === 'failed' ? 'failed' : ''} ${msgIdx === 0 ? 'first-in-minute' : ''}`}
            >
              <p className="message-content">{message.content}</p>
              {msgIdx === 0 && <span className="timestamp">{mg.minute}</span>}
              {(message.status === 'sending' || message.status === 'failed') && (
                <span className={`message-status ${message.status === 'failed' ? 'failed' : ''}`}>
                  {message.status === 'failed' ? message.errorText ?? 'Message not sent.' : 'sending...'}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

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

  const groups = messages.reduce<MessageGroup[]>((acc, message) => {
    const last = acc[acc.length - 1];
    if (last && last.userId === message.user.id) {
      last.messages.push(message);
    } else {
      acc.push({ userId: message.user.id, username: message.user.username, messages: [message] });
    }
    return acc;
  }, []);

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

        {groups.map((group, index) => (
          <MessageGroupItem key={index} group={group} currentUserId={currentUserId} />
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
