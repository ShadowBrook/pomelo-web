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
 * 只存 key + 元数据，不存 url；url 由服务端读侧注入。
 */
export function buildMediaContent(params: {
  key: string;
  fileName: string;
  size: number;
  duration?: number;
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
  return JSON.stringify(content);
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
