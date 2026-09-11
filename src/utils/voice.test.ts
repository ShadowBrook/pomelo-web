import { describe, it, expect } from 'vitest';
import { recordedVoiceMime, voiceExt } from './voice';

/**
 * 录音容器判定回归。
 * Safari 录出的是 MP4/AAC，Chrome 录出的是 WebM/Opus；
 * start() 之前 MediaRecorder.mimeType 为空，若据此回退成 audio/webm，
 * Safari 录的文件会被错标成 webm（上传 Content-Type 也错），Safari 播放时解码失败。
 */
describe('录音容器判定', () => {
  it('以数据块类型为准（Safari 录 MP4）', () => {
    expect(recordedVoiceMime('audio/mp4', '')).toBe('audio/mp4');
    expect(voiceExt(recordedVoiceMime('audio/mp4'))).toBe('m4a');
  });

  it('以数据块类型为准（Chrome 录 WebM，含 codecs 参数）', () => {
    expect(recordedVoiceMime('audio/webm;codecs=opus', '')).toBe('audio/webm');
    expect(voiceExt(recordedVoiceMime('audio/webm;codecs=opus'))).toBe('webm');
  });

  it('数据块无类型时回退到录制器 mimeType', () => {
    expect(recordedVoiceMime(undefined, 'audio/mp4;codecs=mp4a.40.2')).toBe('audio/mp4');
  });

  it('两者都没有时才用默认值', () => {
    expect(recordedVoiceMime(undefined, '')).toBe('audio/webm');
    expect(recordedVoiceMime(undefined, undefined)).toBe('audio/webm');
  });

  it('绝不把 MP4 判成 webm（本次事故的形态）', () => {
    expect(recordedVoiceMime('audio/mp4', '')).not.toBe('audio/webm');
  });
});
