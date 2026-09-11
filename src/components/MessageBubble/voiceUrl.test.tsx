import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MessageBubble, filledBars, voiceBars } from './index';
import { MsgType } from '@/sdk/types';
import type { ChatMessage } from '@/stores/useChatStore';

/**
 * 语音气泡渲染回归：
 * 发送方本地副本的 content 只有对象 key（签名 url 由服务端读侧注入），
 * 本地 blob 预览失效后若直接把空/失效地址交给原生 player，浏览器会渲染自带的错误提示
 * （用户看到播放器里显示「错误」）。无地址时应降级为占位，有地址时才渲染播放器。
 */
function voiceMsg(content: string, localUrl?: string): ChatMessage {
  return {
    id: 'm-1',
    senderId: '__self__',
    recipientId: 'peer-1',
    msgType: MsgType.VOICE,
    content,
    status: 'sent',
    timestamp: Date.now(),
    localUrl,
  };
}

const render = (m: ChatMessage) => renderToStaticMarkup(<MessageBubble message={m} isSelf />);

describe('语音消息播放器渲染', () => {
  it('content 无签名 url 且无本地预览时不渲染原生播放器', () => {
    const html = render(voiceMsg(JSON.stringify({ key: 'voice/a.webm', duration: 11000 })));

    expect(html).not.toContain('<audio');
    expect(html).toContain('[语音]');
    expect(html).toContain('11″');
  });

  it('content 带签名 url 时渲染可播放的播放器', () => {
    const html = render(voiceMsg(JSON.stringify({
      key: 'voice/a.webm', duration: 8000, url: 'http://localhost:9002/pomelo-media/voice/a.webm?sig=x',
    })));

    expect(html).toContain('<audio');
    expect(html).toContain('http://localhost:9002/pomelo-media/voice/a.webm?sig=x');
  });

  it('发送后本地 blob 预览可用时仍渲染播放器（乐观副本）', () => {
    const html = render(voiceMsg(
      JSON.stringify({ key: 'voice/a.webm', duration: 8000 }),
      'blob:http://localhost:5173/local-preview',
    ));

    expect(html).toContain('<audio');
    expect(html).toContain('blob:http://localhost:5173/local-preview');
  });
});

/**
 * 语音条尺寸回归：原生 `<audio controls>` 有约 300px 的固定最小宽度且不随 max-width 收缩，
 * 气泡上限是会话宽度的 60%，会被顶格撑宽并溢出内边距（表现为"气泡很胖、控件压边"）。
 * 因此播放器必须是自绘的紧凑控件，宽度按时长收敛在有界区间内。
 */
describe('语音条尺寸', () => {
  const signed = (durationMs: number) => voiceMsg(JSON.stringify({
    key: 'voice/a.webm', duration: durationMs, url: 'http://localhost:9002/voice/a.webm?sig=x',
  }));

  it('不渲染原生控件（controls 属性缺席）', () => {
    const html = render(signed(8000));

    expect(html).toContain('<audio');
    expect(html).not.toContain('controls');
  });

  it('渲染自绘播放按钮', () => {
    const html = render(signed(8000));

    expect(html).toContain('aria-label="播放语音"');
  });

  it('宽度按时长映射且不超过上限', () => {
    expect(render(signed(11000))).toContain('width:130px');
    expect(render(signed(120000))).toContain('width:170px');
  });

  it('时长未知时给中性宽度且不编造秒数', () => {
    const html = render(voiceMsg(JSON.stringify({ key: 'voice/a.webm', url: 'http://x/a.webm?sig=y' })));

    expect(html).toContain('width:108px');
    expect(html).not.toContain('1″');
  });
});

/**
 * 播放中的波形提示：点击播放后要有可见的"正在播放"标识，
 * 并由波形填充反映播放位置（原生控件被撤掉后，进度只能自己画）。
 */
describe('语音波形条', () => {
  const html = render(voiceMsg(JSON.stringify({
    key: 'voice/a.webm', duration: 11000, url: 'http://localhost:9002/voice/a.webm?sig=x',
  })));

  it('渲染波形柱', () => {
    expect(html).toContain('data-testid="voice-wave"');
    expect(html.match(/rounded-full bg-text-sub\/30/g)?.length).toBe(14);
  });

  it('未播放时不带动画类、进度为 0', () => {
    expect(html).not.toContain('voice-wave-playing');
    expect(html).toContain('data-filled="0"');
  });
});

describe('voiceBars', () => {
  it('同 seed 形状稳定（重渲染/滚动不跳变）', () => {
    expect(voiceBars('voice/a.webm')).toEqual(voiceBars('voice/a.webm'));
  });

  it('不同 seed 形状不同', () => {
    expect(voiceBars('voice/a.webm')).not.toEqual(voiceBars('voice/b.webm'));
  });

  it('高度落在 25%~100% 且数量可控', () => {
    const bars = voiceBars('seed', 20);

    expect(bars).toHaveLength(20);
    for (const h of bars) {
      expect(h).toBeGreaterThanOrEqual(0.25);
      expect(h).toBeLessThanOrEqual(1);
    }
  });
});

describe('filledBars', () => {
  it('按进度取整，边界不越界', () => {
    expect(filledBars(14, 0)).toBe(0);
    expect(filledBars(14, -1)).toBe(0);
    expect(filledBars(14, 0.5)).toBe(7);
    expect(filledBars(14, 0.99)).toBe(13);
    expect(filledBars(14, 1)).toBe(14);
    expect(filledBars(14, 2)).toBe(14);
  });
});
