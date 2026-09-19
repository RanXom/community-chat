import { useState, type FormEvent } from 'react';

import type { Channel } from '../../types';
import Dialog from '../common/Dialog';

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function createErrorText(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'Channel already exists') {
      return 'A channel with that name already exists.';
    }
    if (err.message === 'Invalid request') {
      return 'Channel name must be 3–64 characters using letters, numbers, underscores, or dashes.';
    }
    if (err.message === 'Insufficient permissions') {
      return "You don't have permission to create channels.";
    }
  }

  return 'Failed to create the channel. Please try again.';
}

function CreateChannelDialog({
  open,
  onCreate,
  onClose,
}: {
  open: boolean;
  onCreate: (name: string, description?: string) => Promise<Channel>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Channel name is required.');
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 64 || !NAME_PATTERN.test(trimmedName)) {
      setError('Channel name must be 3–64 characters using letters, numbers, underscores, or dashes.');
      return;
    }

    setSubmitting(true);

    try {
      const trimmedDescription = description.trim();
      await onCreate(trimmedName, trimmedDescription || undefined);
      onClose();
    } catch (err) {
      setError(createErrorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} title="CREATE CHANNEL" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label>
          NAME
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={64}
            placeholder="general"
            required
          />
        </label>

        <label>
          DESCRIPTION <span className="optional">optional</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder="What is this channel about?"
          />
        </label>

        {error && <p className="error">! {error}</p>}

        <div className="dialog-actions">
          <button type="button" className="dialog-cancel" onClick={onClose} disabled={submitting}>
            CANCEL
          </button>
          <button type="submit" className="dialog-submit" disabled={submitting}>
            {submitting ? 'CREATING…' : 'CREATE'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export default CreateChannelDialog;