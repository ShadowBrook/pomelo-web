import { ConnectionState } from '@/sdk/types';

interface Props {
  state: ConnectionState;
  onReconnect?: () => void;
}

export function ConnectionBanner({ state, onReconnect }: Props) {
  if (state === 'connected') return null;

  const config = {
    connecting: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      message: '正在连接...',
    },
    disconnected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      message: '连接已断开',
    },
    reconnecting: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      message: '正在重连...',
    },
  };

  const { bg, text, message } = config[state] || config.disconnected;

  return (
    <div className={`${bg} ${text} text-center text-xs py-1.5 px-4`}>
      <span>{message}</span>
      {state === 'disconnected' && onReconnect && (
        <button onClick={onReconnect} className="ml-2 underline hover:no-underline">
          点击重连
        </button>
      )}
    </div>
  );
}
