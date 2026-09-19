import type { Message } from '../../types';

function Composer({
  value,
  onChange,
  onSend,
  onSaveEdit,
  editingMessage,
  onCancelEdit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSaveEdit: (content: string) => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
}) {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingMessage) {
      onSaveEdit(value.trim());
    } else {
      onSend();
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <span>&gt;</span>
      <div className="composer-input-wrapper">
        {editingMessage && (
          <div className="editing-indicator">
            <div className="editing-original">
              {editingMessage.content}
            </div>
            <span className="editing-badge">Editing</span>
          </div>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={editingMessage ? 'edit message...' : 'type message...'}
          autoFocus
        />
        {editingMessage && (
          <button type="button" className="cancel-edit-btn" onClick={onCancelEdit}>
            cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default Composer;