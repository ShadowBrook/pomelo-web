import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore.updateAvatar', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isLoggedIn: false });
  });

  it('登录态下回填头像 URL', () => {
    useAuthStore.setState({
      user: { userId: '100', userName: 'alice', nickname: '爱丽丝', avatar: '', signature: '' },
      isLoggedIn: true,
    });

    useAuthStore.getState().updateAvatar('https://minio.example/signed.png');

    expect(useAuthStore.getState().user?.avatar).toBe('https://minio.example/signed.png');
    // 其余字段不被覆盖
    expect(useAuthStore.getState().user?.nickname).toBe('爱丽丝');
  });

  it('未登录（无 user）时调用安全无副作用', () => {
    useAuthStore.getState().updateAvatar('https://minio.example/signed.png');

    expect(useAuthStore.getState().user).toBeNull();
  });
});
