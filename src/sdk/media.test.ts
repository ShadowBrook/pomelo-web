import { describe, it, expect } from 'vitest';
import {
  buildMediaContent,
  parseMediaContent,
  getMediaUrl,
  mediaPreview,
  isMediaType,
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
});
