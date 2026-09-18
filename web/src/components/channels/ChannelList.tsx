import type { Channel } from '../../types';

function ChannelList({
  channels,
  activeChannelId,
  canDelete,
  onSelect,
  onDelete,
}: {
  channels: Channel[];
  activeChannelId: string | undefined;
  canDelete: boolean;
  onSelect: (channel: Channel) => void;
  onDelete: (channel: Channel) => void;
}) {
  return (
    <div className="channel-list">
      {channels.map((item) => (
        <div key={item.id} className="channel-row">
          <button
            className={`channel-name${activeChannelId === item.id ? ' active' : ''}`}
            onClick={() => onSelect(item)}
            title={item.description ?? item.name}
          >
            &gt; #{item.name}
          </button>

          {canDelete && (
            <button
              className="channel-delete"
              onClick={() => onDelete(item)}
              aria-label={`Delete channel #${item.name}`}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChannelList;