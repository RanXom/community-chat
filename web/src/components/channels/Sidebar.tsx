import { useState } from 'react';

import type { Channel, User } from '../../types';
import ThemeSwitcher from '../common/ThemeSwitcher';
import SettingsDialog from '../common/SettingsDialog';
import ChannelList from './ChannelList';
import CreateChannelDialog from './CreateChannelDialog';
import DeleteChannelDialog from './DeleteChannelDialog';

function Sidebar({
  user,
  channels,
  activeChannel,
  canManageChannels,
  onSelectChannel,
  onLogout,
  onCreateChannel,
  onDeleteChannel,
  onUpdateProfile,
}: {
  user: User | null;
  channels: Channel[];
  activeChannel: Channel | null;
  canManageChannels: boolean;
  onSelectChannel: (channel: Channel) => void;
  onLogout: () => void;
  onCreateChannel: (name: string, description?: string) => Promise<Channel>;
  onDeleteChannel: (channelId: string) => Promise<void>;
  onUpdateProfile: (data: { username: string; email: string }) => Promise<User>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside className="sidebar terminal">
      <header>CHANNELS</header>

      <ChannelList
        channels={channels}
        activeChannelId={activeChannel?.id}
        canDelete={canManageChannels}
        onSelect={onSelectChannel}
        onDelete={setDeleteTarget}
      />

      {canManageChannels && (
        <div className="admin-actions">
          <button type="button" onClick={() => setCreateOpen(true)}>
            + create channel
          </button>
        </div>
      )}

      <ThemeSwitcher />

      <footer>
        <button className="link-button user-button" onClick={() => setSettingsOpen(true)}>
          {user?.username}
          {canManageChannels && <em className="role-tag">admin</em>}
        </button>
        <button className="link-button" onClick={onLogout}>
          logout
        </button>
      </footer>

      {createOpen && (
        <CreateChannelDialog open onCreate={onCreateChannel} onClose={() => setCreateOpen(false)} />
      )}

      {deleteTarget && (
        <DeleteChannelDialog
          channel={deleteTarget}
          onDelete={onDeleteChannel}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          open
          user={user}
          onClose={() => setSettingsOpen(false)}
          onUpdateProfile={onUpdateProfile}
        />
      )}
    </aside>
  );
}

export default Sidebar;