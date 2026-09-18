import type { Channel } from '../../types';

function ChannelList({
  channels,
  activeChannelId,
  onSelect,
}: {
  channels: Channel[];
  activeChannelId: string | undefined;
  onSelect: (channel: Channel) => void;
}) {
  return (
    <div className="channel-list">
      {channels.map((item) => (
        <button
          key={item.id}
          className={activeChannelId === item.id ? 'active' : ''}
          onClick={() => onSelect(item)}
        >
          &gt; #{item.name}
        </button>
      ))}
    </div>
  );
}

export default ChannelList;