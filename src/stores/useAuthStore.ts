import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/utils/api';

interface UserInfo {
  userId: string;   // NanoID, 系统生成的外部唯一标识
  userName: string; // 用户名, 登录凭证
  nickname: string;
  avatar: string;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isLoggedIn: boolean;

  // Actions
  login: (userName: string, password: string) => Promise<void>;
  register: (userName: string, nickname: string, password: string, avatar?: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: async (userName: string, password: string) => {
        const res = await api.login(userName, password);
        if (res.code === 0) {
          set({
            user: {
              userId: res.userId!,
              userName: res.userName || userName,
              nickname: res.nickname || userName,
              avatar: res.avatar || '',
            },
            token: res.token || 'test-token',
            isLoggedIn: true,
          });
        } else {
          throw new Error(res.message || '登录失败');
        }
      },

      register: async (userName: string, nickname: string, password: string, avatar?: string) => {
        const res = await api.register(userName, nickname, password, avatar);
        if (res.code === 0 || res.code === 201) {
          // 注册成功，后端返回 NanoID userId
          set({
            user: {
              userId: res.userId!,
              userName: userName,
              nickname,
              avatar: avatar || '',
            },
            token: res.token || 'test-token',
            isLoggedIn: true,
          });
        } else if (res.code === 409) {
          // 用户名已存在，尝试登录
          await get().login(userName, password);
        } else {
          throw new Error(res.message || '注册失败');
        }
      },

      logout: () => {
        set({ user: null, token: null, isLoggedIn: false });
      },

      restoreSession: () => {
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
