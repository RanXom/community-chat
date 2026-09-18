import type { Message } from '../../types';

function MessageItem({ message }: { message: Message }) {
  const sending = message.status === 'sending';
  const failed = message.status === 'failed';

  return (
    <article className={failed ? 'failed' : sending ? 'sending' : undefined}>
      <div>
        <strong>{message.user.username}</strong>
        <span className="timestamp">{new Date(message.createdAt).toLocaleTimeString()}</span>
      </div>
      <p className="message-content">{message.content}</p>
      {(sending || failed) && (
        <p className={failed ? 'message-status failed' : 'message-status'}>
          {failed ? message.errorText ?? 'Message not sent.' : 'sending…'}
        </p>
      )}
    </article>
  );
}

export default MessageItem;