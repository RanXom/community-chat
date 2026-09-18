import type { Message } from '../../types';

function MessageItem({ message }: { message: Message }) {
  return (
    <article>
      <div>
        <strong>{message.user.username}</strong>
        <span className="timestamp">{new Date(message.createdAt).toLocaleTimeString()}</span>
      </div>
      <p>{message.content}</p>
    </article>
  );
}

export default MessageItem;