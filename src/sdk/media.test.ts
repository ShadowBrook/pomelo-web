import { describe, it, expect } from 'vitest';
import {
  buildMediaContent,
  parseMediaContent,
  getMediaUrl,
  getMediaThumbUrl,
  formatDuration,
  mediaPreview,
  isMediaType,
  wrapReplyContent,
  unwrapReplyContent,
  buildReplySnippet,
  contentNeedsSignedUrl,
} from './media';
import { MsgType } from './types';

describe('media helpers', () => {
  it('isMediaType 覆盖图片/语音/视频/文件/表情', () => {
    expect(isMediaType(MsgType.IMAGE)).toBe(true);
    expect(isMediaType(MsgType.VOICE)).toBe(true);
    expect(isMediaType(MsgType.VIDEO)).toBe(true);
    expect(isMediaType(MsgType.FILE)).toBe(true);
    expect(isMediaType(MsgType.EMOJI)).toBe(true);
    expect(isMediaType(MsgType.TEXT)).toBe(false);
  });

  it('buildMediaContent 只存 key + 元数据，含 format 与可选 duration', () => {
    const raw = buildMediaContent({ key: 'image/100/a.jpg', fileName: 'a.jpg', size: 1024, duration: 3200 });
    const c = JSON.parse(raw);
    expect(c).toEqual({ key: 'image/100/a.jpg', size: 1024, fileName: 'a.jpg', format: 'jpg', duration: 3200 });
    expect(c.url).toBeUndefined();
  });

  it('buildMediaContent 无 duration 时不带该字段', () => {
    const raw = buildMediaContent({ key: 'file/1/b.pdf', fileName: 'b.pdf', size: 10 });
    expect(JSON.parse(raw).duration).toBeUndefined();
  });

  it('buildMediaContent 携带视频封面 thumb key，url/thumbUrl 不落 content', () => {
    const raw = buildMediaContent({
      key: 'video/1/c.mp4', fileName: 'c.mp4', size: 2048, duration: 65000, thumb: 'image/1/poster.jpg',
    });
    const c = JSON.parse(raw);
    expect(c.thumb).toBe('image/1/poster.jpg');
    expect(c.url).toBeUndefined();
    expect(c.thumbUrl).toBeUndefined();
  });

  it('getMediaThumbUrl 取服务端注入的 thumbUrl', () => {
    expect(getMediaThumbUrl({ content: '{"key":"v.mp4","thumbUrl":"http://s/poster.jpg"}' })).toBe('http://s/poster.jpg');
    expect(getMediaThumbUrl({ content: '{"key":"v.mp4"}' })).toBeUndefined();
    expect(getMediaThumbUrl({ content: 'bad' })).toBeUndefined();
  });

  it('wrapReplyContent/unwrapReplyContent 往返一致', () => {
    const raw = wrapReplyContent(
      { messageId: '123', senderId: '456', msgType: 1, senderName: 'alice', snippet: 'hi', thumb: '' },
      { msgType: 1, content: '回复正文' },
    );
    const o = unwrapReplyContent(raw);
    expect(o?.reply.messageId).toBe('123');
    expect(o?.reply.snippet).toBe('hi');
    expect(o?.body.content).toBe('回复正文');
    expect(unwrapReplyContent('not-json')).toBeNull();
    expect(unwrapReplyContent('{"a":1}')).toBeNull();
  });

  it('buildReplySnippet 对 REPLY 拍平取正文摘要，不显示 JSON', () => {
    const replyContent = wrapReplyContent(
      { messageId: '1', senderId: '2', msgType: 1, senderName: 'bob', snippet: '原文', thumb: '' },
      { msgType: 1, content: '回复的消息正文' },
    );
    expect(buildReplySnippet({ msgType: MsgType.REPLY, content: replyContent })).toBe('回复的消息正文');
  });

  it('formatDuration 毫秒转 m:ss', () => {
    expect(formatDuration(undefined)).toBeUndefined();
    expect(formatDuration(0)).toBeUndefined();
    expect(formatDuration(1000)).toBe('0:01');
    expect(formatDuration(65000)).toBe('1:05');
    expect(formatDuration(600000)).toBe('10:00');
  });

  it('parseMediaContent 解析合法 JSON，坏 JSON 返回 null', () => {
    const c = parseMediaContent('{"key":"a/b.jpg","url":"http://get/a/b.jpg"}');
    expect(c?.key).toBe('a/b.jpg');
    expect(c?.url).toBe('http://get/a/b.jpg');
    expect(parseMediaContent('not-json')).toBeNull();
    expect(parseMediaContent('{"width":100}')).toBeNull();
    expect(parseMediaContent('')).toBeNull();
  });

  it('getMediaUrl 优先 content.url，其次 localUrl', () => {
    expect(getMediaUrl({ content: '{"key":"a.jpg","url":"http://s/a.jpg"}' })).toBe('http://s/a.jpg');
    expect(getMediaUrl({ content: '{"key":"a.jpg"}' })).toBeUndefined();
    expect(getMediaUrl({ content: '{"key":"a.jpg"}', localUrl: 'blob:local' })).toBe('blob:local');
    expect(getMediaUrl({ content: 'plain text', localUrl: 'blob:local' })).toBe('blob:local');
  });

  it('mediaPreview 按类型给出短文案，不显示原始 JSON', () => {
    expect(mediaPreview(MsgType.TEXT, 'hello')).toBe('hello');
    expect(mediaPreview(MsgType.IMAGE, '{"key":"a.jpg"}')).toBe('[图片]');
    expect(mediaPreview(MsgType.VIDEO, '{"key":"v.mp4"}')).toBe('[视频]');
    expect(mediaPreview(MsgType.EMOJI, '{"key":"e.png"}')).toBe('[表情]');
    expect(mediaPreview(MsgType.FILE, '{"key":"f.zip","fileName":"report.zip"}')).toBe('[文件] report.zip');
    expect(mediaPreview(MsgType.VOICE, '{"key":"v.webm","duration":3200}')).toBe('[语音] 3″');
    expect(mediaPreview(MsgType.VOICE, 'bad')).toBe('[语音]');
  });

  it('contentNeedsSignedUrl 识别未签名 key（普通媒体/转发/引用）', () => {
    // 普通媒体：有 key 无 url → 需要刷新
    expect(contentNeedsSignedUrl(MsgType.IMAGE, '{"key":"image/1/a.jpg"}')).toBe(true);
    expect(contentNeedsSignedUrl(MsgType.IMAGE, '{"key":"image/1/a.jpg","url":"http://get"}')).toBe(false);

    // 合并转发：items 内嵌 media key
    const fwdUnsigned = JSON.stringify({ t: 'x', items: [{ msgType: 2, media: { key: 'image/1/a.jpg' } }] });
    const fwdSigned = JSON.stringify({ t: 'x', items: [{ msgType: 2, media: { key: 'image/1/a.jpg', url: 'http://get' } }] });
    expect(contentNeedsSignedUrl(MsgType.FORWARD, fwdUnsigned)).toBe(true);
    expect(contentNeedsSignedUrl(MsgType.FORWARD, fwdSigned)).toBe(false);

    // 引用：body 内媒体 key / reply.thumb 无 thumbUrl
    const replyMedia = wrapReplyContent(
      { messageId: '1', senderId: '2', msgType: 1, senderName: 'a', snippet: 's', thumb: '' },
      { msgType: 2, content: '{"key":"image/1/a.jpg"}' },
    );
    expect(contentNeedsSignedUrl(MsgType.REPLY, replyMedia)).toBe(true);
    const replyThumb = wrapReplyContent(
      { messageId: '1', senderId: '2', msgType: 4, senderName: 'a', snippet: '[视频]', thumb: 'image/1/p.jpg' },
      { msgType: 1, content: 'hi' },
    );
    expect(contentNeedsSignedUrl(MsgType.REPLY, replyThumb)).toBe(true);

    // 纯文本消息不触发
    expect(contentNeedsSignedUrl(MsgType.TEXT, 'hello')).toBe(false);
  });
});
