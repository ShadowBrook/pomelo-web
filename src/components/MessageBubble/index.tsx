import React, { useMemo, useRef, useState } from 'react';
import { CachedImg } from '@/components/CachedImg';
import { ChatMessage } from '@/stores/useChatStore';
import { MsgType } from '@/sdk/types';
import {
  parseMediaContent,
  getMediaUrl,
  getMediaThumbUrl,
  formatBytes,
  formatDuration,
  formatCallRecord,
  parseCallRecord,
  unwrapReplyContent,
} from '@/sdk/media';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';

/** 视频消息：封面缩略图 + 播放浮层 + 时长角标，点击弹出全屏播放页 */
function VideoMessage({ url, thumbUrl, localThumbUrl, durationMs }: { url?: string; thumbUrl?: string; localThumbUrl?: string; durationMs?: number }) {
  const [open, setOpen] = useState(false);
  const duration = formatDuration(durationMs);

  // 上传完成前（localUrl 阶段）或无封面降级：用 video preload=metadata 展示首帧。
  // #t=0.1 媒体片段让 iOS/旧 WebView 也解码绘制该帧（否则只有部分浏览器出首帧）
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
          <CachedImg url={thumbUrl} alt="视频封面" className="w-full h-full object-cover" />
        ) : localThumbUrl ? (
          <img src={localThumbUrl} alt="视频封面" className="w-full h-full object-cover" />
        ) : (
          <video src={`${url}#t=0.1`} preload="metadata" muted playsInline className="w-full h-full object-cover" />
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

const VOICE_BAR_COUNT = 14;

/**
 * 波形柱高度（0.25~1）。用 seed 做确定性伪随机，保证同一条消息每次渲染形状一致——
 * 否则列表滚动/重渲染时波形会跳变。
 */
export function voiceBars(seed: string, count: number = VOICE_BAR_COUNT): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
    bars.push(0.25 + ((hash >>> 8) % 1000) / 1000 * 0.75);
  }
  return bars;
}

/** 已播过的柱数；播到末尾时整条点亮 */
export function filledBars(count: number, progress: number): number {
  if (!(progress > 0)) {
    return 0;
  }
  return progress >= 1 ? count : Math.floor(progress * count);
}

/**
 * 语音消息：自绘紧凑播放条 —— 播放/暂停按钮 + 波形 + 时长。
 * <p>
 * 不用原生 `<audio controls>`：原生控件有约 300px 的固定最小宽度且不随 `max-width` 收缩，
 * 气泡上限是会话宽度的 60%，会被顶格撑宽、控件还会溢出气泡内边距。
 * 波形柱在播放中起伏、已播部分填充主色，用于标识"正在播放"与播放位置。
 */
function VoiceMessage({ url, durationMs, seed }: { url?: string; durationMs?: number; seed?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  const seconds = durationMs && durationMs > 0 ? Math.max(1, Math.round(durationMs / 1000)) : 0;
  // 下限保证波形有可辨认的宽度，上限保证气泡不被撑宽
  const width = Math.min(170, Math.max(108, 64 + seconds * 6));
  const bars = useMemo(() => voiceBars(seed || String(durationMs ?? '')), [seed, durationMs]);
  const filled = filledBars(bars.length, progress);

  if (!url) {
    // 无可播放地址（如本地 blob 预览已失效）：不渲染播放器，避免浏览器在控件里显示自带错误
    return <span className="text-xs text-gray-400">[语音]{seconds > 0 ? ` ${seconds}″` : ''}</span>;
  }

  const toggle = () => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => setFailed(true));
    }
  };

  // 优先用音频元素解出的真实时长（元数据里的 duration 是录制端估算值）
  const onTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    const total = el.duration && Number.isFinite(el.duration) ? el.duration : seconds;
    setProgress(total > 0 ? Math.min(1, el.currentTime / total) : 0);
  };

  return (
    <div className="flex items-center gap-2" style={{ width }}>
      <button
        type="button"
        onClick={toggle}
        className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/25"
        title={playing ? '暂停' : '播放'}
        aria-label={playing ? '暂停语音' : '播放语音'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
            <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 ml-0.5" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>
      {failed ? (
        <span className="text-xs text-text-sub flex-1">播放失败</span>
      ) : (
        <div
          className={`flex items-end gap-[2px] h-5 flex-1 min-w-0 ${playing ? 'voice-wave-playing' : ''}`}
          data-testid="voice-wave"
          data-filled={filled}
          aria-hidden="true"
        >
          {bars.map((height, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full ${i < filled ? 'bg-primary' : 'bg-text-sub/30'}`}
              style={{ height: `${Math.round(height * 100)}%`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}
      <span className="text-xs text-text-sub flex-shrink-0">
        {seconds > 0 ? `${seconds}″` : '语音'}
      </span>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onError={() => { setFailed(true); setPlaying(false); }}
        className="hidden"
      />
    </div>
  );
}

/** 图片点开展开全屏预览，再次点击关闭 */
/**
 * 图片消息：列表内先加载缩略图（小图，消息秒出），点开大图时再请求原图。
 * thumbUrl 缺失时（旧消息/生成失败）回退为原图。
 */
function ImageMessage({ url, thumbUrl }: { url: string; thumbUrl?: string }) {
  const [open, setOpen] = useState(false);
  const previewUrl = thumbUrl || url;
  return (
    <>
      <CachedImg
        url={previewUrl}
        alt="图片"
        className="max-w-full rounded cursor-pointer object-contain"
        style={{ maxHeight: 200 }}
        onClick={() => setOpen(true)}
        fallback={(
          /* 缓存就绪前先占位，避免气泡高度跳变 */
          <div
            className="rounded bg-black/[0.06] animate-pulse cursor-pointer"
            style={{ width: 160, height: 120 }}
            onClick={() => setOpen(true)}
          />
        )}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          {/* 原图仅在点开时才请求（挂载时才触发，保持懒加载） */}
          <CachedImg url={url} alt="图片预览" className="max-w-[92vw] max-h-[90vh] object-contain rounded shadow-2xl" />
        </div>
      )}
    </>
  );
}

/** 引用块：气泡正文上方的快照摘要（唯一渲染点，由 Body 的 REPLY 分支调用） */
function ReplyBlock({ reply }: { reply: { senderName?: string; senderId: string; snippet: string; thumbUrl?: string } }) {
  return (
    <div className="flex items-stretch gap-1.5 mb-1 rounded bg-black/5 px-1.5 py-1 max-w-[260px]">
      {reply.thumbUrl ? <CachedImg url={reply.thumbUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : null}
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
      return (m.thumbUrl || m.url)
        ? <CachedImg url={m.thumbUrl || m.url} alt="" className="max-h-[160px] rounded" />
        : <div className="text-text-sub">[图片]</div>;
    case MsgType.VIDEO:
      if (m.url) {
        return <video src={m.url} controls poster={m.thumbUrl} className="max-h-[200px] rounded" />;
      }
      return m.thumbUrl
        ? <CachedImg url={m.thumbUrl} alt="视频封面" className="max-h-[160px] rounded" />
        : <div className="text-text-sub">[视频]</div>;
    case MsgType.VOICE:
      return <VoiceMessage url={m.url} durationMs={m.duration} seed={m.key} />;
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
          <div className="bg-panel rounded-lg shadow-2xl w-[min(420px,92vw)] max-h-[80vh] overflow-y-auto p-3" onClick={(e) => e.stopPropagation()}>
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
  /** 会话对端（单聊=对方 userId；群聊=groupId），用于解析发送者头像 */
  peerId?: string;
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

/** 通话记录图标：语音 = 听筒，视频 = 摄像机 */
function CallRecordIcon({ video }: { video: boolean }) {
  return video ? (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M4 6.5h9.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zm13.5 3.7 4.5-2.7v9l-4.5-2.7v-3.6z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

/** 文本中的 @提及 高亮（@token 以空白/结尾为界；无 @ 时直接返回原文） */
function renderTextWithMentions(content: string): React.ReactNode {
  if (!content.includes('@')) {
    return content;
  }
  const parts = content.split(/(@[^\s@]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') && part.length > 1
      ? <span key={i} className="text-primary">{part}</span>
      : part,
  );
}

/** 按类型渲染消息正文（引用解包后递归复用）；localThumbUrl 是发送方本地视频封面 */
function renderInner(msgType: number, content: string, url?: string, thumbUrl?: string, localThumbUrl?: string): React.ReactNode {
  switch (msgType) {
    case MsgType.TEXT:
      return <p className="whitespace-pre-wrap">{renderTextWithMentions(content)}</p>;

    case MsgType.SYSTEM: {
      // 通话记录：气泡文案带类型图标；左右侧由 MessageList 按服务端 outgoing 标记决定
      return (
        <span className="flex items-center gap-1.5">
          <CallRecordIcon video={parseCallRecord(content)?.mediaType === 1} />
          {formatCallRecord(content)}
        </span>
      );
    }

    case MsgType.IMAGE:
      return url
        ? <ImageMessage url={url} thumbUrl={thumbUrl} />
        : <span className="text-xs text-gray-400">[图片]</span>;

    case MsgType.EMOJI:
      return url
        ? <CachedImg url={url} alt="表情" className="w-16 h-16 object-contain" />
        : <span className="text-2xl">[表情]</span>;

    case MsgType.VOICE: {
      // seed 用对象 key（不是签名 url）：签名每次拉取都会变，会让波形跳变
      const c = parseMediaContent(content);
      return <VoiceMessage url={url} durationMs={c?.duration} seed={c?.key} />;
    }

    case MsgType.VIDEO: {
      const durationMs = parseMediaContent(content)?.duration;
      return (
        <VideoMessage url={url} thumbUrl={getMediaThumbUrl({ content })} localThumbUrl={localThumbUrl} durationMs={durationMs} />
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
  const thumbUrl = parseMediaContent(message.content)?.thumbUrl;

  // 引用消息：解包渲染「引用块 + 原正文」，正文递归分发（可为文本/媒体/转发卡片）
  if (message.msgType === MsgType.REPLY) {
    const inner = unwrapReplyContent(message.content);
    if (!inner) {
      return <span className="text-xs text-gray-400">[引用]</span>;
    }
    // 内层正文若是媒体，服务端已递归签名：原图/缩略图从内层 content 取
    const innerMedia = parseMediaContent(inner.body.content);
    return (
      <>
        <ReplyBlock reply={inner.reply} />
        {renderInner(
          inner.body.msgType,
          inner.body.content,
          innerMedia?.url ?? message.localUrl,
          innerMedia?.thumbUrl,
          message.localThumbUrl,
        )}
      </>
    );
  }

  return renderInner(message.msgType, message.content, url, thumbUrl, message.localThumbUrl);
}

export const MessageBubble = React.memo(function MessageBubble({
  message, isSelf, peerId, onRetry, isGroup, onReadClick, readCount, groupMemberCount, onReply, onForward, selecting, selected, onToggleSelect, onStartSelect,
}: Props) {
  const avatar = useAuthStore((s) => s.user?.avatar);
  const selfChar = useAuthStore((s) => s.user?.nickname?.charAt(0).toUpperCase() || '我');
  // 对方头像：单聊查好友资料，群聊按发送者查成员缓存（均已在入库时做过同源改写）
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const groupMembers = useGroupStore((s) => s.groupMembers[peerId ?? '']);
  const senderMember = groupMembers?.find((m) => m.userId === message.senderId);
  const peerName = isGroup
    ? senderMember?.nickname || message.senderNickname || message.senderUserName || message.senderId
    : friend?.nickname || friend?.userName || message.senderNickname || message.senderUserName || message.senderId;
  const peerAvatar = sameOriginMediaUrl((isGroup ? senderMember?.avatar : friend?.avatar) || '');

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
          {peerAvatar
            ? <CachedImg url={peerAvatar} alt={peerName} className="w-full h-full object-cover" fallback={peerName.charAt(0).toUpperCase()} />
            : peerName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className={`flex flex-col max-w-[80%] md:max-w-[60%] ${isSelf ? 'items-end' : 'items-start'}`}>
        {/* 气泡行：状态/已读槽紧贴气泡，避免被下方 hover 操作行撑宽而远离 */}
        <div className="flex items-start gap-1">
          {isSelf && !selecting && (
            <div className="w-6 flex justify-center items-center self-center flex-shrink-0">
              {isSelf && message.uploadProgress != null ? (
                // 上传中：显示百分比（媒体上传可能持续数秒，百分比比转圈更有信息量）
                <span className="text-[9px] text-text-sub tabular-nums leading-none">
                  {message.uploadProgress}%
                </span>
              ) : qos && (message.status === 'pending' || message.status === 'sending') && (
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
        {/* hover 操作：引用 / 转发 / 多选（多选模式与通话记录等系统消息下隐藏） */}
        {!selecting && message.msgType !== MsgType.SYSTEM && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-text-sub px-1 mt-0.5">
            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onReply?.(message); }}>引用</span>
            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onForward?.(message); }}>转发</span>
            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onStartSelect?.(message); }}>多选</span>
          </div>
        )}
      </div>

      {isSelf && (
        <div className="w-9 h-9 rounded-md bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary text-xs ml-2 overflow-hidden">
          <CachedImg url={avatar} alt="me" className="w-full h-full object-cover" fallback={selfChar} />
        </div>
      )}
    </div>
  );
});
