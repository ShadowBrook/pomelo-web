import React, { useState } from 'react';
import { ChatMessage } from '@/stores/useChatStore';
import { MsgType } from '@/sdk/types';
import { parseMediaContent, getMediaUrl, formatBytes } from '@/sdk/media';
import { useAuthStore } from '@/stores/useAuthStore';

/** 图片点开展开全屏预览，再次点击关闭 */
function ImageMessage({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={url}
        alt="图片"
        className="max-w-full rounded cursor-pointer object-contain"
        style={{ maxHeight: 200 }}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <img src={url} alt="图片预览" className="max-w-[92vw] max-h-[90vh] object-contain rounded shadow-2xl" />
        </div>
      )}
    </>
  );
}

interface Props {
  message: ChatMessage;
  isSelf: boolean;
  onRetry?: (messageId: string) => void;
  isGroup?: boolean;
  onReadClick?: (messageId: string, seq: number) => void;
}

function Body({ message }: { message: ChatMessage }) {
  const url = getMediaUrl(message);

  switch (message.msgType) {
    case MsgType.TEXT:
      return <p className="whitespace-pre-wrap">{message.content}</p>;

    case MsgType.IMAGE:
      return url
        ? <ImageMessage url={url} />
        : <span className="text-xs text-gray-400">[图片]</span>;

    case MsgType.EMOJI:
      return url
        ? <img src={url} alt="表情" className="w-16 h-16 object-contain" />
        : <span className="text-2xl">[表情]</span>;

    case MsgType.VOICE: {
      const duration = parseMediaContent(message.content)?.duration;
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <audio controls src={url || undefined} className="max-w-[200px]" />
          {duration ? (
            <span className="text-xs text-gray-500">{Math.round(duration / 1000)}″</span>
          ) : null}
        </div>
      );
    }

    case MsgType.VIDEO:
      return url
        ? <video controls src={url} className="max-w-[260px] max-h-[260px] rounded" />
        : <span className="text-xs text-gray-400">[视频]</span>;

    case MsgType.FILE: {
      const c = parseMediaContent(message.content);
      const name = c?.fileName || '文件';
      const size = c?.size ? formatBytes(c.size) : '';
      return (
        <a
          href={url || undefined}
          download={name}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-2 bg-white/50 rounded hover:bg-white/80 max-w-[220px]"
        >
          <span className="text-lg flex-shrink-0">📎</span>
          <span className="text-xs flex flex-col min-w-0">
            <span className="text-text-main truncate">{name}</span>
            {size && <span className="text-gray-400">{size}</span>}
          </span>
        </a>
      );
    }

    default:
      return <p className="whitespace-pre-wrap">{message.content}</p>;
  }
}

export const MessageBubble = React.memo(function MessageBubble({ message, isSelf, onRetry, isGroup, onReadClick }: Props) {
  const avatar = useAuthStore((s) => s.user?.avatar);
  const selfChar = useAuthStore((s) => s.user?.nickname?.charAt(0).toUpperCase() || '我');

  const qos = isSelf && !isGroup && (message.status === 'pending' || message.status === 'sending' || message.status === 'failed');

  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-2 px-4 items-start`}>
      {/* 外置状态/QoS 槽（自己消息在气泡左侧） */}
      {isSelf && (
        <div className="w-6 flex justify-center items-center self-center flex-shrink-0 mr-1">
          {qos && (message.status === 'pending' || message.status === 'sending') && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-sub animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a10 10 0 1 1-10 10" strokeLinecap="round" />
            </svg>
          )}
          {qos && message.status === 'failed' && (
            <span
              className="w-4 h-4 rounded-full bg-danger text-white text-[10px] leading-4 text-center font-bold cursor-pointer"
              title={message.msgType === MsgType.TEXT ? '发送失败，点击重试' : '发送失败，请重新选择文件'}
              onClick={() => message.msgType === MsgType.TEXT && onRetry?.(message.id)}
            >
              !
            </span>
          )}
          {isGroup && message.seq && (
            <span
              className="text-xs text-accent cursor-pointer hover:opacity-75"
              title="查看已读成员"
              onClick={(e) => { e.stopPropagation(); onReadClick?.(message.id, message.seq!); }}
            >
              ◯
            </span>
          )}
        </div>
      )}

      {!isSelf && (
        <div className="w-9 h-9 rounded-md bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary text-xs mr-2 overflow-hidden">
          {(message.senderNickname || message.senderUserName || message.senderId).charAt(0).toUpperCase()}
        </div>
      )}

      {/* 气泡 */}
      <div className={`max-w-[60%] px-3 py-2 rounded-md text-sm break-words relative ${
        isSelf ? 'bg-bubble-self text-text-main bubble-self' : 'bg-bubble-other text-text-main border border-line shadow-sm bubble-other'
      }`}>
        <Body message={message} />
      </div>

      {isSelf && (
        <div className="w-9 h-9 rounded-md bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary text-xs ml-2 overflow-hidden">
          {avatar ? <img src={avatar} alt="me" className="w-full h-full object-cover" /> : selfChar}
        </div>
      )}
    </div>
  );
});
