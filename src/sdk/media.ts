import { MediaContent, MsgType } from './types';

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
    return obj as MediaContent;
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

/** 字节数转人类可读大小 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
