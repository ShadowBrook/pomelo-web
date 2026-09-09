import React, { useState } from 'react';
import { ChatMessage } from '@/stores/useChatStore';
import { MsgType } from '@/sdk/types';
import {
  parseMediaContent,
  getMediaUrl,
  getMediaThumbUrl,
  formatBytes,
  formatDuration,
  unwrapReplyContent,
} from '@/sdk/media';
import { useAuthStore } from '@/stores/useAuthStore';

/** 视频消息：封面缩略图 + 播放浮层 + 时长角标，点击弹出全屏播放页 */
function VideoMessage({ url, thumbUrl, durationMs }: { url?: string; thumbUrl?: string; durationMs?: number }) {
  const [open, setOpen] = useState(false);
  const duration = formatDuration(durationMs);

  // 上传完成前（localUrl 阶段）或无封面降级：用 video preload=metadata 展示首帧
  if (!url) {
    return <span className="text-xs text-gray-400">[视频]</span>;
  }

  return (
    <>
      <div
        className="relative cursor-pointer rounded overflow-hidden"
        style={{ width: 220, height: 140, backgroundColor: 'rgba(0,0,0,0.06)' }}
        onClick={() => setOpen(true)}
        title="点击播放"
      >
        {thumbUrl ? (
          <img src={thumbUrl} alt="视频封面" className="w-full h-full object-cover" />
        ) : (
          <video src={url} preload="metadata" muted className="w-full h-full object-cover" />
        )}
        {/* 播放浮层 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/45 flex items-center justify-center group-hover:bg-black/60 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white ml-0.5" fill="currentColor">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </div>
        </div>
        {duration && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] leading-none">
            {duration}
          </span>
        )}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <video
            src={url}
            controls
            autoPlay
            className="max-w-[92vw] max-h-[90vh] rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 text-white text-lg leading-none hover:bg-white/25"
            title="关闭"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

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

/** 引用块：气泡正文上方的快照摘要（唯一渲染点，由 Body 的 REPLY 分支调用） */
function ReplyBlock({ reply }: { reply: { senderName?: string; senderId: string; snippet: string; thumbUrl?: string } }) {
  return (
    <div className="flex items-stretch gap-1.5 mb-1 rounded bg-black/5 px-1.5 py-1 max-w-[260px]">
      {reply.thumbUrl ? <img src={reply.thumbUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : null}
      <div className="min-w-0 text-left">
        <div className="text-[11px] text-primary leading-tight truncate">{reply.senderName || reply.senderId}</div>
        <div className="text-[11px] text-text-sub leading-tight truncate">{reply.snippet}</div>
      </div>
    </div>
  );
}

interface ForwardItem {
  msgType: number;
  senderName?: string;
  text?: string;
  ts?: number;
  media?: { key?: string; url?: string; thumb?: string; thumbUrl?: string; fileName?: string; size?: number; duration?: number };
}

/** 合并转发详情层内单条消息：按 msgType 渲染，缺签名 url 时降级为类型占位 */
function ForwardItemBody({ it }: { it: ForwardItem }) {
  if (it.text) {
    return <div className="text-text-main whitespace-pre-wrap">{it.text}</div>;
  }
  const m = it.media;
  if (!m) {
    return <div className="text-text-sub">[媒体消息]</div>;
  }
  switch (it.msgType) {
    case MsgType.IMAGE:
    case MsgType.EMOJI:
      return m.url
        ? <img src={m.url} alt="" className="max-h-[160px] rounded" />
        : <div className="text-text-sub">[图片]</div>;
    case MsgType.VIDEO:
      if (m.url) {
        return <video src={m.url} controls poster={m.thumbUrl} className="max-h-[200px] rounded" />;
      }
      return m.thumbUrl
        ? <img src={m.thumbUrl} alt="视频封面" className="max-h-[160px] rounded" />
        : <div className="text-text-sub">[视频]</div>;
    case MsgType.VOICE:
      return m.url
        ? <audio controls src={m.url} className="max-w-[200px]" />
        : <div className="text-text-sub">[语音]</div>;
    case MsgType.FILE:
      return m.url
        ? (
          <a href={m.url} download={m.fileName} target="_blank" rel="noreferrer" className="text-primary underline">
            📎 {m.fileName || '文件'}{m.size ? ` (${formatBytes(m.size)})` : ''}
          </a>
        )
        : <div className="text-text-sub">[文件] {m.fileName || ''}</div>;
    default:
      return <div className="text-text-sub">[媒体消息]</div>;
  }
}

/** 合并转发卡片：标题 + 条数，点击弹出只读详情层 */
function ForwardCard({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  let title = '[聊天记录]';
  let items: ForwardItem[] = [];
  try {
    const o = JSON.parse(content);
    title = o.t || title;
    items = o.items || [];
  } catch { /* 降级为标题 */ }
  return (
    <>
      <div className="cursor-pointer rounded bg-white/60 border border-line p-2 min-w-[180px]" onClick={() => setOpen(true)}>
        <div className="text-xs text-text-main font-medium flex items-center gap-1">📋 {title}</div>
        <div className="text-[11px] text-text-sub mt-1">{items.length} 条消息 · 点击查看</div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-panel rounded-lg shadow-2xl w-[420px] max-h-[80vh] overflow-y-auto p-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-text-main mb-2 pb-2 border-b border-line">{title}</div>
            {items.map((it, i) => (
              <div key={i} className="mb-2 text-xs">
                <div className="text-primary mb-0.5">{it.senderName}</div>
                <ForwardItemBody it={it} />
              </div>
            ))}
          </div>
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
  /** 群聊已读人数（不含自己），>0 时圈内显示数字；达到全部已读时显示对勾 */
  readCount?: number;
  /** 群成员总数（含自己），用于判断全部已读 */
  groupMemberCount?: number;
  onReply?: (m: ChatMessage) => void;
  onForward?: (m: ChatMessage) => void;
  selecting?: boolean;
  selected?: boolean;
  onToggleSelect?: (m: ChatMessage) => void;
  onStartSelect?: (m: ChatMessage) => void;
}

/** 按类型渲染消息正文（引用解包后递归复用） */
function renderInner(msgType: number, content: string, url?: string): React.ReactNode {
  switch (msgType) {
    case MsgType.TEXT:
      return <p className="whitespace-pre-wrap">{content}</p>;

    case MsgType.IMAGE:
      return url
        ? <ImageMessage url={url} />
        : <span className="text-xs text-gray-400">[图片]</span>;

    case MsgType.EMOJI:
      return url
        ? <img src={url} alt="表情" className="w-16 h-16 object-contain" />
        : <span className="text-2xl">[表情]</span>;

    case MsgType.VOICE: {
      const duration = parseMediaContent(content)?.duration;
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <audio controls src={url || undefined} className="max-w-[200px]" />
          {duration ? (
            <span className="text-xs text-gray-500">{Math.round(duration / 1000)}″</span>
          ) : null}
        </div>
      );
    }

    case MsgType.VIDEO: {
      const durationMs = parseMediaContent(content)?.duration;
      return (
        <VideoMessage url={url} thumbUrl={getMediaThumbUrl({ content })} durationMs={durationMs} />
      );
    }

    case MsgType.FILE: {
      const c = parseMediaContent(content);
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

    case MsgType.FORWARD:
      return <ForwardCard content={content} />;

    default:
      return <p className="whitespace-pre-wrap">{content}</p>;
  }
}

function Body({ message }: { message: ChatMessage }) {
  const url = getMediaUrl(message);

  // 引用消息：解包渲染「引用块 + 原正文」，正文递归分发（可为文本/媒体/转发卡片）
  if (message.msgType === MsgType.REPLY) {
    const inner = unwrapReplyContent(message.content);
    if (!inner) {
      return <span className="text-xs text-gray-400">[引用]</span>;
    }
    return (
      <>
        <ReplyBlock reply={inner.reply} />
        {renderInner(inner.body.msgType, inner.body.content, message.localUrl)}
      </>
    );
  }

  return renderInner(message.msgType, message.content, url);
}

export const MessageBubble = React.memo(function MessageBubble({
  message, isSelf, onRetry, isGroup, onReadClick, readCount, groupMemberCount, onReply, onForward, selecting, selected, onToggleSelect, onStartSelect,
}: Props) {
  const avatar = useAuthStore((s) => s.user?.avatar);
  const selfChar = useAuthStore((s) => s.user?.nickname?.charAt(0).toUpperCase() || '我');

  const qos = isSelf && !isGroup && (message.status === 'pending' || message.status === 'sending' || message.status === 'failed');
  // 全部已读：除自己外的成员都已读（成员数含自己）
  const allRead = !!readCount && readCount > 0
    && !!groupMemberCount && groupMemberCount > 1
    && readCount >= groupMemberCount - 1;

  return (
    <div
      className={`group flex ${isSelf ? 'justify-end' : 'justify-start'} mb-2 px-4 items-start ${selecting ? 'cursor-pointer' : ''}`}
      onClick={selecting ? () => onToggleSelect?.(message) : undefined}
    >
      {/* 多选复选圈 */}
      {selecting && (
        <div className="w-6 flex justify-center items-center self-center flex-shrink-0 mr-1">
          <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] text-white ${selected ? 'bg-primary border-primary' : 'border-text-sub'}`}>
            {selected ? '✓' : ''}
          </span>
        </div>
      )}

      {!isSelf && (
        <div className="w-9 h-9 rounded-md bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary text-xs mr-2 overflow-hidden">
          {(message.senderNickname || message.senderUserName || message.senderId).charAt(0).toUpperCase()}
        </div>
      )}

      <div className={`flex flex-col max-w-[60%] ${isSelf ? 'items-end' : 'items-start'}`}>
        {/* 气泡行：状态/已读槽紧贴气泡，避免被下方 hover 操作行撑宽而远离 */}
        <div className="flex items-start gap-1">
          {isSelf && !selecting && (
            <div className="w-6 flex justify-center items-center self-center flex-shrink-0">
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
                  className="cursor-pointer hover:opacity-75"
                  title={allRead ? '全部已读，点击查看' : readCount && readCount > 0 ? `${readCount} 人已读，点击查看` : '查看已读成员'}
                  onClick={(e) => { e.stopPropagation(); onReadClick?.(message.id, message.seq!); }}
                >
                  {allRead ? (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[10px] leading-none">✓</span>
                  ) : readCount && readCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] leading-none">
                      {readCount}
                    </span>
                  ) : (
                    <span className="text-xs text-accent">◯</span>
                  )}
                </span>
              )}
            </div>
          )}
          <div className={`px-3 py-2 rounded-md text-sm break-words relative ${
            isSelf ? 'bg-bubble-self text-text-main bubble-self' : 'bg-bubble-other text-text-main border border-line shadow-sm bubble-other'
          }`}>
            <Body message={message} />
          </div>
        </div>
        {/* hover 操作：引用 / 转发 / 多选（多选模式下隐藏） */}
        {!selecting && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-text-sub px-1 mt-0.5">
            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onReply?.(message); }}>引用</span>
            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onForward?.(message); }}>转发</span>
            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onStartSelect?.(message); }}>多选</span>
          </div>
        )}
      </div>

      {isSelf && (
        <div className="w-9 h-9 rounded-md bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary text-xs ml-2 overflow-hidden">
          {avatar ? <img src={avatar} alt="me" className="w-full h-full object-cover" /> : selfChar}
        </div>
      )}
    </div>
  );
});
