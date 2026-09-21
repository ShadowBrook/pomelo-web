import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/utils/api';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';

interface UserInfo {
  userId: string;   // Snowflake 全局唯一 ID（字符串形式）
  userName: string; // 用户名, 登录凭证
  nickname: string;
  avatar: string;
  signature: string; // 个性签名
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
  /** 头像更新成功后回填（avatar 为读侧预签名 URL） */
  updateAvatar: (avatar: string) => void;
  /** 个性签名更新成功后回填 */
  updateSignature: (signature: string) => void;
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
              avatar: sameOriginMediaUrl(res.avatar || ''),
              signature: res.signature || '',
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
          // 注册成功，后端返回 Snowflake userId（字符串）
          set({
            user: {
              userId: res.userId!,
              userName: userName,
              nickname,
              avatar: avatar || '',
              signature: '',
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
          // 兼容持久化里的旧 http 直连头像 URL（Safari 混合内容拦截）
          set({ isLoggedIn: true, user: { ...user, signature: user.signature ?? '', avatar: sameOriginMediaUrl(user.avatar) } });
        }
      },

      updateAvatar: (avatar) => {
        set((state) => (state.user ? { user: { ...state.user, avatar: sameOriginMediaUrl(avatar) } } : state));
      },

      updateSignature: (signature) => {
        set((state) => (state.user ? { user: { ...state.user, signature } } : state));
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
