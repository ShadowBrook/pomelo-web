import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/utils/api';

interface UserInfo {
  userId: string;
  nickname: string;
  avatar: string;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isLoggedIn: boolean;

  // Actions
  login: (userId: string, password: string) => Promise<void>;
  register: (userId: string, nickname: string, password: string, avatar?: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: async (userId: string, password: string) => {
        // 后端无独立 login API，使用 register 接口
        // 注册成功(code=0)或已存在(code=409)都视为登录成功
        const res = await api.register(userId, userId, password);
        if (res.code === 0 || res.code === 409) {
          // 尝试获取用户信息
          try {
            const profile = await api.getProfile(userId);
            set({
              user: {
                userId,
                nickname: profile.data?.nickname || userId,
                avatar: profile.data?.avatar || '',
              },
              token: 'test-token',
              isLoggedIn: true,
            });
          } catch {
            // 即使获取 profile 失败也允许登录
            set({
              user: { userId, nickname: userId, avatar: '' },
              token: 'test-token',
              isLoggedIn: true,
            });
          }
        } else {
          throw new Error(res.message || 'Login failed');
        }
      },

      register: async (userId: string, nickname: string, password: string, avatar?: string) => {
        const res = await api.register(userId, nickname, password, avatar);
        if (res.code === 0) {
          set({
            user: { userId, nickname, avatar: avatar || '' },
            token: 'test-token',
            isLoggedIn: true,
          });
        } else if (res.code === 409) {
          throw new Error('用户名已存在');
        } else {
          throw new Error(res.message || 'Registration failed');
        }
      },

      logout: () => {
        set({ user: null, token: null, isLoggedIn: false });
      },

      restoreSession: () => {
        // persist 中间件会自动从 localStorage 恢复状态
        // 这个方法用于显式触发恢复后的验证
        const { user, token } = get();
        if (user && token) {
          set({ isLoggedIn: true });
        }
      },
    }),
    {
      name: 'pomelo-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
