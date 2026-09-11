import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from './useWindowStore';

describe('useWindowStore (v9 复合窗)', () => {
  beforeEach(() => useWindowStore.getState().clearAll());

  it('初始无会话', () => {
    expect(useWindowStore.getState().chatPeerId).toBeNull();
  });

  it('openChat 指向该会话；重复 openChat 幂等切换目标', () => {
    useWindowStore.getState().openChat('a');
    expect(useWindowStore.getState().chatPeerId).toBe('a');
    useWindowStore.getState().openChat('b');
    expect(useWindowStore.getState().chatPeerId).toBe('b');
  });

  it('closeChat 清空会话；clearAll 复位', () => {
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().closeChat();
    expect(useWindowStore.getState().chatPeerId).toBeNull();
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().clearAll();
    expect(useWindowStore.getState().chatPeerId).toBeNull();
  });
});
