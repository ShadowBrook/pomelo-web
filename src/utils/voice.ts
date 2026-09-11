/**
 * 录音容器/扩展名判定。
 *
 * MediaRecorder 的 mimeType 在 start() 之前为空字符串（Safari 尤其如此），
 * 若此时用硬编码回退，会把 Safari 实际录出的 MP4/AAC 标成 audio/webm：
 * 文件以 .webm 上传、Content-Type 也写成 audio/webm，Safari 播放时按声明类型解码失败
 * （MEDIA_ERR_SRC_NOT_SUPPORTED，播放器显示「错误」），而 Chrome 会自行嗅探内容照常播放。
 * 因此只在录制结束后（拿到数据块）判定，并以数据块自身的 type 为准。
 */
export function recordedVoiceMime(chunkType?: string, recorderMimeType?: string): string {
  const raw = chunkType || recorderMimeType || '';
  const base = raw.split(';')[0].trim().toLowerCase();
  return base || 'audio/webm';
}

/** 录制的 MIME → 文件扩展名（Chrome 默认 webm，Safari 为 mp4/m4a） */
export function voiceExt(mime: string): string {
  const base = (mime || '').split(';')[0].toLowerCase();
  if (base.includes('mp4')) return 'm4a';
  if (base.includes('ogg')) return 'ogg';
  return 'webm';
}
