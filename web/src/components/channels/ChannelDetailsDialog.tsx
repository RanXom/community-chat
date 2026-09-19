import { useEffect, useState, type FormEvent } from 'react';

import { addChannelMember, getChannelMembers } from '../../services/api';
import type { Channel, ChannelMember } from '../../types';
import Dialog from '../common/Dialog';

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function updateErrorText(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'Channel already exists') {
      return 'A channel with that name already exists.';
    }
    if (err.message === 'Invalid request') {
      return 'Name must be 3–64 characters using letters, numbers, underscores, or dashes.';
    }
    if (err.message === 'Channel not found') {
      return 'This channel no longer exists.';
    }
    if (err.message === 'Insufficient permissions') {
      return "You don't have permission to edit channels.";
    }
  }

  return 'Failed to save channel changes.';
}

function addMemberErrorText(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'User not found') {
      return 'No user found with that username or email.';
    }
    if (err.message === 'Already a member') {
      return 'That user is already in this channel.';
    }
    if (err.message === 'Channel not found') {
      return 'This channel no longer exists.';
    }
    if (err.message === 'Insufficient permissions') {
      return "You don't have permission to add members.";
    }
  }

  return 'Failed to add member.';
}

function ChannelDetailsDialog({
  open,
  channel,
  token,
  currentUserId,
  isAdmin,
  onClose,
  onChannelUpdated,
}: {
  open: boolean;
  channel: Channel;
  token: string;
  currentUserId: string | undefined;
  isAdmin: boolean;
  onClose: () => void;
  onChannelUpdated: (
    channelId: string,
    data: { name?: string; description?: string },
  ) => Promise<Channel>;
}) {
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? '');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;

    getChannelMembers(token, channel.id)
      .then((data) => {
        if (alive) setMembers(data.members);
      })
      .catch((err) => {
        if (alive) setLoadError(err instanceof Error ? err.message : 'Failed to load members');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, channel.id]);

  function startEditing() {
    setName(channel.name);
    setDescription(channel.description ?? '');
    setSaveError('');
    setEditing(true);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaveError('');

    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 64 || !NAME_PATTERN.test(trimmedName)) {
      setSaveError('Name must be 3–64 characters using letters, numbers, underscores, or dashes.');
      return;
    }

    setSaving(true);

    try {
      await onChannelUpdated(channel.id, {
        name: trimmedName,
        description: description.trim(),
      });
      setEditing(false);
    } catch (err) {
      setSaveError(updateErrorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember(event: FormEvent) {
    event.preventDefault();
    setAddError('');

    const trimmed = identifier.trim();

    if (!trimmed) {
      setAddError('Enter a username or email.');
      return;
    }

    setAdding(true);

    try {
      const { member } = await addChannelMember(token, channel.id, trimmed);
      setMembers((current) => [...current, member]);
      setIdentifier('');
    } catch (err) {
      setAddError(addMemberErrorText(err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} title={`# ${channel.name}`} onClose={onClose}>
      <section className="channel-facts">
        {editing ? (
          <form onSubmit={handleSave}>
            <label>
              NAME
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={64}
                autoFocus
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

            {saveError && <p className="error">! {saveError}</p>}

            <div className="dialog-actions">
              <button type="button" className="dialog-cancel" onClick={() => setEditing(false)} disabled={saving}>
                CANCEL
              </button>
              <button type="submit" className="dialog-submit" disabled={saving}>
                {saving ? 'SAVING…' : 'SAVE'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="channel-description">{channel.description || '( no description )'}</p>
            {isAdmin && (
              <button type="button" className="link-button" onClick={startEditing}>
                edit channel
              </button>
            )}
          </>
        )}
      </section>

      <h3 className="section-title">MEMBERS ({members.length})</h3>

      <div className="members-list">
        {loading && <p className="dim">loading members…</p>}

        {!loading && loadError && <p className="error">! {loadError}</p>}

        {!loading &&
          !loadError &&
          members.map((member) => (
            <div key={member.user.id} className="member-row">
              <span className="member-name">
                {member.user.username}
                {member.user.id === currentUserId && <em className="member-you">you</em>}
              </span>
              <span className={`member-role role-${member.user.role}`}>{member.user.role}</span>
            </div>
          ))}
      </div>

      {isAdmin && (
        <form className="add-member-form" onSubmit={handleAddMember}>
          <h3 className="section-title">ADD MEMBER</h3>

          <label>
            USERNAME OR EMAIL
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              maxLength={255}
              placeholder="buddy@example.com or buddy001"
            />
          </label>

          {addError && <p className="error">! {addError}</p>}

          <div className="dialog-actions">
            <button type="submit" className="dialog-submit" disabled={adding}>
              {adding ? 'ADDING…' : 'ADD'}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export default ChannelDetailsDialog;