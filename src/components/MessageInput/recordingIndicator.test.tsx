import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecordingIndicator } from './index';

/**
 * 录音提示条回归：原来是一条带麦克风 emoji 的文案，
 * 现在改成波形提示，且要与"正在播放"的波形区分开（颜色/节奏不同）。
 */
describe('录音提示条', () => {
  const html = renderToStaticMarkup(<RecordingIndicator />);

  it('不再包含麦克风 emoji', () => {
    expect(html).not.toContain('🎤');
  });

  it('渲染录音波形柱', () => {
    expect(html).toContain('data-testid="recording-wave"');
    expect(html.match(/voice-wave-recording/g)?.length).toBe(1);
    expect(html.match(/bg-danger flex-shrink-0/g)?.length).toBe(10);
  });

  it('波形使用录音态动画而非播放态', () => {
    expect(html).toContain('voice-wave-recording');
    expect(html).not.toContain('voice-wave-playing');
  });

  it('保留提示文案', () => {
    expect(html).toContain('录音中，点击停止并发送');
  });
});
