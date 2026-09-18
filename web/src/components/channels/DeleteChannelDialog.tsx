import { useState } from 'react';

import type { Channel } from '../../types';
import Dialog from '../common/Dialog';

function deleteErrorText(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'Channel not found') {
      return 'This channel no longer exists.';
    }
    if (err.message === 'Insufficient permissions') {
      return "You don't have permission to delete channels.";
    }
  }

  return 'Failed to delete the channel. Please try again.';
}

function DeleteChannelDialog({
  channel,
  onDelete,
  onClose,
}: {
  channel: Channel;
  onDelete: (channelId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setError('');
    setDeleting(true);

    try {
      await onDelete(channel.id);
      onClose();
    } catch (err) {
      setError(deleteErrorText(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open title="DELETE CHANNEL" onClose={onClose}>
      <p className="dialog-warning">
        Delete <strong>#{channel.name}</strong>? This permanently removes the channel and all of its
        messages. This cannot be undone.
      </p>

      {error && <p className="error">! {error}</p>}

      <div className="dialog-actions">
        <button type="button" className="dialog-cancel" onClick={onClose} disabled={deleting}>
          CANCEL
        </button>
        <button type="button" className="dialog-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'DELETING…' : 'DELETE'}
        </button>
      </div>
    </Dialog>
  );
}

export default DeleteChannelDialog;