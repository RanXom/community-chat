import { useState } from 'react';

import { useTheme } from '../../hooks/useTheme';
import type { User } from '../../types';
import Dialog from './Dialog';

const THEMES: { value: string; label: string }[] = [
  { value: 'dark', label: 'dark terminal' },
  { value: 'light', label: 'light terminal' },
  { value: 'catppuccin-mocha', label: 'catppuccin mocha' },
  { value: 'catppuccin-latte', label: 'catppuccin latte' },
  { value: 'tokyo-night', label: 'tokyo night' },
  { value: 'gruvbox-dark', label: 'gruvbox dark' },
  { value: 'gruvbox-light', label: 'gruvbox light' },
  { value: 'nord', label: 'nord' },
  { value: 'nord-light', label: 'nord light' },
];

function SettingsDialog({
  open,
  user,
  onClose,
  onUpdateProfile,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUpdateProfile: (data: { username: string; email: string }) => Promise<User>;
}) {
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaveError('');
    setSaving(true);

    try {
      await onUpdateProfile({ username: username.trim(), email: email.trim() });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} title="SETTINGS" onClose={onClose}>
      <form onSubmit={handleSave}>
        <section className="settings-section">
          <h3 className="section-title">PROFILE</h3>

          <label>
            USERNAME
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
              autoFocus
            />
          </label>

          <label>
            EMAIL
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
            />
          </label>

          {saveError && <p className="error">! {saveError}</p>}

          <div className="dialog-actions">
            <button type="button" className="dialog-cancel" onClick={onClose} disabled={saving}>
              CANCEL
            </button>
            <button type="submit" className="dialog-submit" disabled={saving}>
              {saving ? 'SAVING…' : 'SAVE'}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h3 className="section-title">APPEARANCE</h3>

          <div className="theme-control">
            <label htmlFor="settings-theme-select">theme</label>
            <select id="settings-theme-select" value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)}>
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </section>
      </form>
    </Dialog>
  );
}

export default SettingsDialog;