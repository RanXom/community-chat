import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

function isEdited(message: Message): boolean {
  return new Date(message.updatedAt).getTime() > new Date(message.createdAt).getTime();
}

interface ContextMenuState {
  messageId: string;
  x: number;
  y: number;
}

function MessageRow({
  message,
  currentUserId,
  currentUserRole,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  onCheckboxChange,
  showCheckbox,
}: {
  message: Message;
  currentUserId: string | undefined;
  currentUserRole: string | undefined;
  isSelected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onContextMenu: (event: React.MouseEvent, messageId: string) => void;
  onCheckboxChange: (messageId: string, checked: boolean) => void;
  showCheckbox: boolean;
}) {
  const isOwn = message.user.id === currentUserId;
  const isModOrAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR';
  const canManage = isOwn || isModOrAdmin;
  const sending = message.status === 'sending';
  const failed = message.status === 'failed';
  const edited = isEdited(message);

  const rowClass = [
    'message-row',
    isSelected ? 'selected' : '',
    isHovered && !isSelected ? 'hovered' : '',
    sending ? 'sending' : '',
    failed ? 'failed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rowClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => onContextMenu(e, message.id)}
    >
      {showCheckbox && canManage && (
        <input
          type="checkbox"
          className="message-checkbox"
          checked={isSelected}
          onChange={(e) => onCheckboxChange(message.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className="message-content-wrapper">
        <p className="message-content">{message.content}</p>
        {edited && <span className="edited-badge">(edited)</span>}
        <span className="timestamp">{formatTime(new Date(message.createdAt))}</span>
        {(sending || failed) && (
          <span className={`message-status ${failed ? 'failed' : ''}`}>
            {failed ? message.errorText ?? 'Message not sent.' : 'sending...'}
          </span>
        )}
      </div>
    </div>
  );
}

function ContextMenu({
  x,
  y,
  onEdit,
  onDelete,
  onClose,
  canEdit,
  canDelete,
}: {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      role="menu"
    >
      {canEdit && (
        <button className="context-menu-item" onClick={() => { onEdit(); onClose(); }} role="menuitem">
          Edit
        </button>
      )}
      {canDelete && (
        <button className="context-menu-item danger" onClick={() => { onDelete(); onClose(); }} role="menuitem">
          Delete
        </button>
      )}
    </div>
  );
}

function MessageGroupItem({
  group,
  currentUserId,
  currentUserRole,
  selectedIds,
  showCheckboxes,
  hoveredId,
  onHover,
  onHoverEnd,
  onContextMenu,
  onCheckboxChange,
}: {
  group: MessageGroup;
  currentUserId: string | undefined;
  currentUserRole: string | undefined;
  selectedIds: Set<string>;
  showCheckboxes: boolean;
  hoveredId: string | null;
  onHover: (messageId: string) => void;
  onHoverEnd: () => void;
  onContextMenu: (event: React.MouseEvent, messageId: string) => void;
  onCheckboxChange: (messageId: string, checked: boolean) => void;
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
          {mg.messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isSelected={selectedIds.has(message.id)}
              isHovered={hoveredId === message.id}
              onMouseEnter={() => onHover(message.id)}
              onMouseLeave={onHoverEnd}
              onContextMenu={onContextMenu}
              onCheckboxChange={onCheckboxChange}
              showCheckbox={showCheckboxes}
            />
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
  currentUserRole,
  onDeleteMessage,
  onEditMessage,
}: {
  channel: Channel | null;
  messages: Message[];
  typingUser: string | null;
  currentUserId: string | undefined;
  currentUserRole: string | undefined;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onEditMessage: (messageId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [prevChannelId, setPrevChannelId] = useState(channel?.id);
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);

  const channelId = channel?.id;

  const groups = messages.reduce<MessageGroup[]>((acc, message) => {
    const last = acc[acc.length - 1];
    if (last && last.userId === message.user.id) {
      last.messages.push(message);
    } else {
      acc.push({ userId: message.user.id, username: message.user.username, messages: [message] });
    }
    return acc;
  }, []);

  if (channelId !== prevChannelId) {
    setPrevChannelId(channelId);
    setPrevMessageCount(messages.length);
    setAtBottom(true);
    setUnseenCount(0);
    setSelectedIds(new Set());
    setShowCheckboxes(false);
    setContextMenu(null);
    setHoveredId(null);
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

  function onHover(messageId: string) {
    if (!showCheckboxes) {
      setHoveredId(messageId);
    }
  }

  function onHoverEnd() {
    if (!showCheckboxes) {
      setHoveredId(null);
    }
  }

  function handleContextMenu(event: React.MouseEvent, messageId: string) {
    event.preventDefault();
    event.stopPropagation();

    const isOwn = messages.find(m => m.id === messageId)?.user.id === currentUserId;
    const isModOrAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR';
    const canManage = isOwn || isModOrAdmin;

    if (!canManage) return;

    if (!selectedIds.has(messageId)) {
      setSelectedIds(new Set([messageId]));
    }
    setShowCheckboxes(true);
    setContextMenu({
      messageId,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function onCheckboxChange(messageId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }
      return next;
    });
  }

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (contextMenu && !event.composedPath().some(el => (el as HTMLElement).classList?.contains?.('context-menu'))) {
      closeContextMenu();
    }
  }, [contextMenu, closeContextMenu]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  function handleDeleteSelected() {
    const idsToDelete = selectedIds.size > 0 ? Array.from(selectedIds) : contextMenu ? [contextMenu.messageId] : [];
    if (idsToDelete.length === 0) return;

    idsToDelete.forEach((id) => {
      onDeleteMessage(id);
    });
    setSelectedIds(new Set());
    setShowCheckboxes(false);
    closeContextMenu();
  }

  function handleEditSelected() {
    const editId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : contextMenu?.messageId;
    if (!editId) return;
    onEditMessage(editId);
    closeContextMenu();
  }

  const contextMenuMessage = contextMenu ? messages.find(m => m.id === contextMenu.messageId) : null;
  const canEdit = Boolean(contextMenuMessage?.user.id === currentUserId);
  const isModOrAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR';
  const canDelete = Boolean(contextMenuMessage && (canEdit || isModOrAdmin));

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
          <MessageGroupItem
            key={index}
            group={group}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            selectedIds={selectedIds}
            showCheckboxes={showCheckboxes}
            hoveredId={hoveredId}
            onHover={onHover}
            onHoverEnd={onHoverEnd}
            onContextMenu={handleContextMenu}
            onCheckboxChange={onCheckboxChange}
          />
        ))}

        {typingUser && typingUser !== currentUserId && <TypingIndicator username={typingUser} />}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEditSelected}
          onDelete={handleDeleteSelected}
          onClose={closeContextMenu}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {unseenCount > 0 && (
        <button className="new-messages-button" onClick={jumpToLatest}>
          ↓ {unseenCount} new {unseenCount === 1 ? 'message' : 'messages'}
        </button>
      )}
    </div>
  );
}

export default MessageList;