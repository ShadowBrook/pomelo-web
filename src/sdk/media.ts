import { CallRecordContent, MediaContent, MsgType, ReplySnippet } from './types';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';

/** 媒体类型判断（含图片/语音/视频/文件/自定义表情） */
export function isMediaType(msgType: number): boolean {
  return msgType === MsgType.IMAGE
    || msgType === MsgType.VOICE
    || msgType === MsgType.VIDEO
    || msgType === MsgType.FILE
    || msgType === MsgType.EMOJI;
}

/** 解析媒体 content JSON；非 JSON 或非媒体消息返回 null */
export function parseMediaContent(content: string): MediaContent | null {
  if (!content) return null;
  try {
    const obj = JSON.parse(content);
    if (!obj || typeof obj !== 'object' || typeof obj.key !== 'string') return null;
    const media = obj as MediaContent;
    // 服务端注入的 url/thumbUrl 是 http presigned 时改写为同源 /minio 代理（Safari 混合内容）
    if (media.url) media.url = sameOriginMediaUrl(media.url);
    if (media.thumbUrl) media.thumbUrl = sameOriginMediaUrl(media.thumbUrl);
    return media;
  } catch {
    return null;
  }
}

/**
 * 构造媒体消息 content JSON（发送方用）。
 * 只存 key + 元数据，不存 url；url/thumbUrl 由服务端读侧注入。
 * thumb 为视频封面帧的对象存储 key（发送端本地抓帧后上传）。
 */
export function buildMediaContent(params: {
  key: string;
  fileName: string;
  size: number;
  duration?: number;
  thumb?: string;
}): string {
  const ext = (params.fileName.split('.').pop() || '').toLowerCase();
  const content: MediaContent = {
    key: params.key,
    size: params.size,
    fileName: params.fileName,
    format: ext,
  };
  if (params.duration && params.duration > 0) {
    content.duration = params.duration;
  }
  if (params.thumb) {
    content.thumb = params.thumb;
  }
  return JSON.stringify(content);
}

/** 视频封面缩略图 URL（服务端注入的 thumbUrl） */
export function getMediaThumbUrl(msg: { content: string }): string | undefined {
  return parseMediaContent(msg.content)?.thumbUrl;
}

/**
 * 视频时长毫秒 → "m:ss" 展示文案。
 */
export function formatDuration(ms?: number): string | undefined {
  if (!ms || ms <= 0) return undefined;
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 从本地视频文件抓取封面帧：定位到 10% 处（跳过常见黑帧）绘制到 canvas。
 * 返回 JPEG Blob 与视频时长毫秒数；失败抛错（调用方降级为无封面）。
 */
export async function captureVideoPoster(file: File): Promise<{ blob: Blob; durationMs: number }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('视频元数据加载失败'));
    });
    const durationMs =
      Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration * 1000) : 0;
    const seekTo = Math.min(Math.max((durationMs * 0.1) / 1000, 0.1), Math.max(video.duration - 0.1, 0.1));
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('视频帧定位超时')), 3000);
      video.onseeked = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timer);
        reject(new Error('视频帧定位失败'));
      };
      video.currentTime = seekTo;
    });
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D 上下文不可用');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7));
    if (!blob) throw new Error('封面帧生成失败');
    return { blob, durationMs };
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

/**
 * 取媒体消息可显示的 URL：优先服务端注入的 presigned GET，
 * 其次发送方本地的 object URL（上传中的乐观预览）。
 */
export function getMediaUrl(msg: { content: string; localUrl?: string }): string | undefined {
  const c = parseMediaContent(msg.content);
  return c?.url || msg.localUrl || undefined;
}

/** 会话列表/搜索结果里媒体消息的短预览文本 */
export function mediaPreview(msgType: number, content: string): string {
  switch (msgType) {
    case MsgType.TEXT:
      return content;
    case MsgType.IMAGE:
      return '[图片]';
    case MsgType.EMOJI:
      return '[表情]';
    case MsgType.VIDEO:
      return '[视频]';
    case MsgType.REPLY:
      return '[引用]';
    case MsgType.FORWARD:
      return '[聊天记录]';
    case MsgType.SYSTEM:
      return formatCallRecord(content);
    case MsgType.FILE: {
      const c = parseMediaContent(content);
      return c?.fileName ? `[文件] ${c.fileName}` : '[文件]';
    }
    case MsgType.VOICE: {
      const c = parseMediaContent(content);
      return c?.duration ? `[语音] ${Math.round(c.duration / 1000)}″` : '[语音]';
    }
    default:
      return content;
  }
}

/** 解析通话记录系统消息 content；非通话记录或坏 JSON 返回 null */
export function parseCallRecord(content: string): CallRecordContent | null {
  try {
    const c = JSON.parse(content);
    if (c && typeof c === 'object' && c.kind === 'call') return c as CallRecordContent;
  } catch { /* 非 JSON */ }
  return null;
}

/**
 * 通话记录气泡是否落在自己一侧（服务端按收件人写入的 outgoing 标记）。
 * 非通话记录或旧数据无标记时返回 null，调用方回退按 senderId 判断。
 */
export function callRecordIsSelf(content: string): boolean | null {
  const outgoing = parseCallRecord(content)?.outgoing;
  return typeof outgoing === 'boolean' ? outgoing : null;
}

/**
 * 通话记录系统消息（MSG_TYPE_SYSTEM）→ 展示文本。
 * content: {"kind":"call","mediaType":0|1,"answered":bool,"durationMs":n,"participants":n,...}
 * participants>2 视为群聊通话，文案带人数。
 */
export function formatCallRecord(content: string): string {
  const c = parseCallRecord(content);
  if (!c) return content;
  const count = Number(c.participants ?? 0);
  const media = `${Number(c.mediaType) === 1 ? '视频' : '语音'}${count > 2 ? `群聊通话（${count} 人）` : '通话'}`;
  const durationMs = Number(c.durationMs);
  if (c.answered && durationMs > 0) {
    const total = Math.round(durationMs / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${media} ${m}:${String(s).padStart(2, '0')}`;
  }
  return `${media} 未接听`;
}

/** 引用摘要生成（客户端为唯一可信源）：按 msgType 给出占位或截断文本 */
export function buildReplySnippet(msg: { msgType: number; content: string }): string {
  if (msg.msgType === MsgType.REPLY) {
    const inner = unwrapReplyContent(msg.content);
    return inner ? buildReplySnippet(inner.body) : '[引用]';
  }
  const c = parseMediaContent(msg.content);
  switch (msg.msgType) {
    case MsgType.IMAGE:
      return '[图片]';
    case MsgType.EMOJI:
      return '[表情]';
    case MsgType.VIDEO:
      return '[视频]';
    case MsgType.REPLY:
      return '[引用]';
    case MsgType.FORWARD:
      return '[聊天记录]';
    case MsgType.VOICE:
      return c?.duration ? `[语音] ${Math.round(c.duration / 1000)}″` : '[语音]';
    case MsgType.FILE:
      return c?.fileName ? `[文件] ${c.fileName}` : '[文件]';
    case MsgType.FORWARD:
      return '[聊天记录]';
    default: {
      const t = (msg.content || '').replace(/\s+/g, ' ').trim();
      return t.length <= 120 ? t : t.slice(0, 120) + '…';
    }
  }
}

/** 引用消息 content 构造：body 为原消息（msgType + content 原样），reply 为被引用消息快照 */
export function wrapReplyContent(reply: {
  messageId: string; senderId: string; msgType: number; senderName?: string; snippet: string; thumb?: string;
}, body: { msgType: number; content: string }): string {
  return JSON.stringify({ reply, body });
}

/** 解包引用消息 content；非引用/坏 JSON 返回 null */
export function unwrapReplyContent(content: string): { reply: ReplySnippet; body: { msgType: number; content: string } } | null {
  if (!content) return null;
  try {
    const o = JSON.parse(content);
    if (!o || typeof o !== 'object' || !o.reply || !o.body) return null;
    const reply: ReplySnippet = {
      messageId: String(o.reply.messageId ?? ''),
      senderId: String(o.reply.senderId ?? ''),
      msgType: Number(o.reply.msgType ?? 0),
      senderName: o.reply.senderName,
      snippet: o.reply.snippet || '',
      thumb: o.reply.thumb,
      thumbUrl: o.reply.thumbUrl,
    };
    return { reply, body: { msgType: Number(o.body.msgType ?? 0), content: String(o.body.content ?? '') } };
  } catch {
    return null;
  }
}

/** 合并转发 content 构建：items 为消息快照（媒体存 key，读侧嵌套签名） */
export function buildForwardContent(
  title: string,
  msgs: Array<{ msgType: number; content: string; senderNickname?: string; senderUserName?: string; senderId: string; timestamp: number }>,
  selfName?: string,
): string {
  const items = msgs.slice(0, 50).map((m) => {
    const media = isMediaType(m.msgType) ? parseMediaContent(m.content) : null;
    // 自己发出的消息 senderId 是本地占位 '__self__'，用当前用户展示名替换
    const senderName = m.senderNickname || m.senderUserName
      || (m.senderId === '__self__' ? (selfName || '我') : m.senderId);
    const base: Record<string, unknown> = {
      msgType: m.msgType,
      senderName,
      ts: m.timestamp,
    };
    if (media) {
      const { url: _u, thumbUrl: _t, ...rest } = media;
      base.media = rest;
    } else {
      base.text = (m.content || '').slice(0, 2000);
    }
    return base;
  });
  const names = Array.from(new Set(items.map((i) => String(i.senderName)))).slice(0, 3).join('、');
  const t = title || `${names}${items.length > 3 ? ' 等' : ''}的聊天记录`;
  return JSON.stringify({ t, n: items.length, items });
}

/**
 * 判断消息 content 是否含有未签名的媒体 key（需要服务端签名刷新）。
 * 覆盖：普通媒体、合并转发 items[].media、引用（递归 body + reply.thumb）。
 */
export function contentNeedsSignedUrl(msgType: number, content: string): boolean {
  if (!content) return false;
  if (isMediaType(msgType)) {
    const c = parseMediaContent(content);
    return !!c?.key && !c.url;
  }
  if (msgType === MsgType.FORWARD) {
    try {
      const items = JSON.parse(content)?.items || [];
      return items.some((it: { media?: { key?: string; url?: string } }) =>
        !!it?.media?.key && !it.media.url);
    } catch {
      return false;
    }
  }
  if (msgType === MsgType.REPLY) {
    const u = unwrapReplyContent(content);
    if (!u) return false;
    return contentNeedsSignedUrl(u.body.msgType, u.body.content)
      || (!!u.reply.thumb && !u.reply.thumbUrl);
  }
  return false;
}

/** 字节数转人类可读大小 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
