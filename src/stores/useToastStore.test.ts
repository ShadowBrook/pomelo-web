import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore, toast } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => useToastStore.getState().clearAll());

  it('toast() 入队并自动消失', () => {
    vi.useFakeTimers();
    toast('功能开发中');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(2600);
    expect(useToastStore.getState().toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('dismiss 可手动移除', () => {
    useToastStore.getState().push('hi');
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
