import type { Channel, User } from '../../types';
import ChannelList from './ChannelList';

function Sidebar({
  user,
  channels,
  activeChannel,
  onSelectChannel,
  onLogout,
}: {
  user: User | null;
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar terminal">
      <header>CHANNELS</header>

      <ChannelList
        channels={channels}
        activeChannelId={activeChannel?.id}
        onSelect={onSelectChannel}
      />

      <footer>
        <span>{user?.username}</span>
        <button className="link-button" onClick={onLogout}>
          logout
        </button>
      </footer>
    </aside>
  );
}

export default Sidebar;