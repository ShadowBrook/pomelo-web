import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from './useWindowStore';

describe('useWindowStore (v9 复合窗)', () => {
  beforeEach(() => useWindowStore.getState().clearAll());

  it('初始不可见', () => {
    expect(useWindowStore.getState().imVisible).toBe(false);
    expect(useWindowStore.getState().chatPeerId).toBeNull();
    expect(useWindowStore.getState().fullscreen).toBe(false);
  });

  it('openChat 打开界面并指向该会话；重复 openChat 幂等切换目标', () => {
    useWindowStore.getState().openChat('a');
    expect(useWindowStore.getState().imVisible).toBe(true);
    expect(useWindowStore.getState().chatPeerId).toBe('a');
    useWindowStore.getState().openChat('b');
    expect(useWindowStore.getState().chatPeerId).toBe('b');
  });

  it('hideIM 隐藏界面但保留 chatPeerId，openIM 恢复', () => {
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().hideIM();
    expect(useWindowStore.getState().imVisible).toBe(false);
    expect(useWindowStore.getState().chatPeerId).toBe('a');
    useWindowStore.getState().openIM();
    expect(useWindowStore.getState().imVisible).toBe(true);
  });

  it('toggleFullscreen 切换', () => {
    useWindowStore.getState().openIM();
    useWindowStore.getState().toggleFullscreen();
    expect(useWindowStore.getState().fullscreen).toBe(true);
    useWindowStore.getState().toggleFullscreen();
    expect(useWindowStore.getState().fullscreen).toBe(false);
  });

  it('closeChat 清空会话；clearAll 复位', () => {
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().toggleFullscreen();
    useWindowStore.getState().closeChat();
    expect(useWindowStore.getState().chatPeerId).toBeNull();
    expect(useWindowStore.getState().imVisible).toBe(true);
    useWindowStore.getState().clearAll();
    expect(useWindowStore.getState()).toMatchObject({ imVisible: false, fullscreen: false, chatPeerId: null });
  });
});
