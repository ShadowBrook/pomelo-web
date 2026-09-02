import React from 'react';
import { ChatMessage } from '@/stores/useChatStore';
import { MessageStatus, MsgType } from '@/sdk/types';
import { parseMediaContent, getMediaUrl, formatBytes } from '@/sdk/media';

interface Props {
  message: ChatMessage;
  isSelf: boolean;
  onRetry?: (messageId: string) => void;
  isGroup?: boolean;
  onReadClick?: (messageId: string, seq: number) => void;
}

function StatusIcon({ status, onRetry }: { status: MessageStatus; onRetry?: () => void }) {
  switch (status) {
    case 'pending':
    case 'sending':
      return <span className="text-xs text-gray-400 animate-pulse">⏳</span>;
    case 'sent':
      return <span className="text-xs text-gray-400" title="已发送">✓</span>;
    case 'delivered':
      return <span className="text-xs text-gray-400" title="已送达">✓✓</span>;
    case 'seen':
      return <span className="text-xs text-blue-500" title="已读">◯</span>;
    case 'failed':
      // 媒体消息不提供重试（本地未保留原文件），点击无效果
      return (
        <span className="text-xs text-red-500" title={onRetry ? '发送失败' : '发送失败，请重新选择文件'}>
          ❌
        </span>
      );
    default:
      return null;
  }
}

function Body({ message }: { message: ChatMessage }) {
  const url = getMediaUrl(message);

  switch (message.msgType) {
    case MsgType.TEXT:
      return <p className="whitespace-pre-wrap">{message.content}</p>;

    case MsgType.IMAGE:
      return url
        ? (
          <img
            src={url}
            alt="图片"
            className="max-w-full rounded cursor-pointer object-contain"
            style={{ maxHeight: 200 }}
            onClick={() => window.open(url, '_blank')}
          />
        )
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
            <span className="text-wechat-text truncate">{name}</span>
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
  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      {/* 对方头像（非己方时显示在左侧） */}
      {!isSelf && (
        <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white text-xs mr-2">
          {(message.senderNickname || message.senderUserName || message.senderId).charAt(0).toUpperCase()}
        </div>
      )}

      {/* 气泡 */}
      <div className={`max-w-[60%] px-3 py-2 rounded-lg text-sm break-words relative ${
        isSelf
          ? 'bg-wechat-bubble-self text-wechat-text rounded-tr-sm bubble-self'
          : 'bg-wechat-bubble-other text-wechat-text border border-gray-200 rounded-tl-sm bubble-other'
      }`}>
        <Body message={message} />
        {/* 己方消息状态图标 */}
        {isSelf && (
          <div className="flex justify-end mt-1 gap-1 items-center">
            {isGroup ? (
              message.seq && (
                <span
                  className="text-xs text-blue-400 cursor-pointer hover:text-blue-600"
                  title="查看已读成员"
                  onClick={(e) => { e.stopPropagation(); onReadClick?.(message.id, message.seq!); }}
                >
                  ◯
                </span>
              )
            ) : (
              <StatusIcon
                status={message.status}
                onRetry={message.msgType === MsgType.TEXT ? () => onRetry?.(message.id) : undefined}
              />
            )}
          </div>
        )}
      </div>

      {/* 己方头像 */}
      {isSelf && (
        <div className="w-9 h-9 rounded-full bg-wechat-green flex-shrink-0 flex items-center justify-center text-white text-xs ml-2">
          我
        </div>
      )}
    </div>
  );
});
