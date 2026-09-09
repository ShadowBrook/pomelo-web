import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConnStore } from './useConnStore';

const reset = () => useConnStore.setState({ state: 'disconnected', reconnectFn: null, logoutFn: null });

describe('useConnStore', () => {
  beforeEach(reset);

  it('set 更新连接状态', () => {
    useConnStore.getState().set('connected');
    expect(useConnStore.getState().state).toBe('connected');
  });

  it('requestReconnect 调用已注册的回调', () => {
    const fn = vi.fn();
    useConnStore.getState().setReconnect(fn);
    useConnStore.getState().requestReconnect();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('未注册回调时 requestReconnect 不抛错', () => {
    expect(() => useConnStore.getState().requestReconnect()).not.toThrow();
  });

  it('setLogout 后 requestLogout 调用回调', () => {
    const fn = vi.fn();
    useConnStore.getState().setLogout(fn);
    useConnStore.getState().requestLogout();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
