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
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (editingMessage) {
      if (!trimmed) return;
      onSaveEdit(trimmed);
    } else {
      onSend();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && editingMessage) {
      event.preventDefault();
      onCancelEdit();
    }
  }

  if (editingMessage) {
    return (
      <form className="composer composer--editing" onSubmit={handleSubmit}>
        <div className="composer-edit-box">
          <div className="composer-edit-header">
            <span className="composer-edit-label">EDITING MESSAGE</span>
            <button type="button" className="composer-edit-close" onClick={onCancelEdit} aria-label="Cancel edit">
              ×
            </button>
          </div>
          <div className="composer-edit-original">{editingMessage.content}</div>
          <div className="composer-edit-input-row">
            <span className="composer-prompt">&gt;</span>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="edit message..."
              autoFocus
            />
          </div>
          <div className="composer-edit-actions">
            <button type="button" className="composer-edit-btn composer-edit-btn--cancel" onClick={onCancelEdit}>
              cancel
            </button>
            <button type="submit" className="composer-edit-btn composer-edit-btn--save">
              save
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <span className="composer-prompt">&gt;</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="type message..."
        autoFocus
      />
    </form>
  );
}

export default Composer;
