import { create } from 'zustand';
import * as api from '@/utils/api';
import type { FriendNotify, FriendDeleteNotify } from '@/sdk/types';
import { getIMClient } from '@/hooks/useIMClient';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';

export interface Friend {
  userId: string;
  userName: string;
  nickname: string;
  avatar: string;
  signature: string;
  online: boolean;
  friendedAt: number;
}

export interface PendingRequest {
  userId: string;   // 申请发起方（Snowflake 字符串）
  userName: string;
  nickname: string;
  avatar: string;
  requestedAt: number;
}

export interface SearchUser {
  userId: string;
  userName: string;
  nickname: string;
  avatar: string;
}

interface FriendState {
  friends: Friend[];
  pendingRequests: PendingRequest[];
  searchResults: SearchUser[];
  loading: boolean;
  error: string | null;

  // Actions
  loadFriends: (userId: string) => Promise<void>;
  loadPendingRequests: (userId: string) => Promise<void>;
  searchUsers: (keyword: string) => Promise<void>;
  sendFriendRequest: (userId: string, friendId: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (userId: string, friendId: string) => Promise<{ success: boolean; message: string }>;
  removeFriend: (userId: string, friendId: string) => Promise<{ success: boolean; message: string }>;
  clearSearchResults: () => void;
  clearError: () => void;
  clearAll: () => void;

  // Notify 处理（由 useIMClient 事件桥接调用）
  onFriendRequestReceived: (notify: FriendNotify) => void;
  onFriendAccepted: (notify: FriendNotify) => void;
  onFriendDeleted: (notify: FriendDeleteNotify) => void;
}

export const useFriendStore = create<FriendState>()((set) => ({
  friends: [],
  pendingRequests: [],
  searchResults: [],
  loading: false,
  error: null,

  // HTTP 接口仍保留：首次加载与离线补全
  loadFriends: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const res = await api.getFriends(userId);
      // 头像 URL 同源改写（http presigned → /minio 代理，规避 Safari 混合内容拦截）
      set({
        friends: (res.friends || []).map((f) => ({
          ...f,
          avatar: sameOriginMediaUrl(f.avatar),
          signature: f.signature || '',
        })),
        loading: false,
      });
    } catch (e: any) {
      set({ loading: false, error: e.message || '加载好友列表失败' });
    }
  },

  loadPendingRequests: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const res = await api.getPendingFriends(userId);
      set({ pendingRequests: (res.pending || []).map((r) => ({ ...r, avatar: sameOriginMediaUrl(r.avatar) })), loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message || '加载好友申请失败' });
    }
  },

  // 以下 4 个 action 已迁移到 WebSocket SDK
  searchUsers: async (keyword: string) => {
    if (!keyword.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      set({ loading: true, error: null });
      const client = getIMClient();
      if (!client) {
        set({ loading: false, error: 'IMClient 未连接' });
        return;
      }
      const res = await client.searchUsers(keyword);
      set({ searchResults: res.users || [], loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message || '搜索失败' });
    }
  },

  sendFriendRequest: async (_userId: string, friendId: string) => {
    try {
      const client = getIMClient();
      if (!client) {
        return { success: false, message: 'IMClient 未连接' };
      }
      const res = await client.addFriend(friendId);
      if (res.code === 0) {
        return { success: true, message: '好友申请已发送' };
      }
      return { success: false, message: res.message || '发送失败' };
    } catch (e: any) {
      return { success: false, message: e.message || '发送失败' };
    }
  },

  acceptFriendRequest: async (_userId: string, friendId: string) => {
    try {
      const client = getIMClient();
      if (!client) {
        return { success: false, message: 'IMClient 未连接' };
      }
      const res = await client.acceptFriend(friendId);
      if (res.code === 0) {
        // 从待处理列表中移除
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r.userId !== friendId),
        }));
        return { success: true, message: '已添加好友' };
      }
      return { success: false, message: res.message || '接受失败' };
    } catch (e: any) {
      return { success: false, message: e.message || '接受失败' };
    }
  },

  removeFriend: async (_userId: string, friendId: string) => {
    try {
      const client = getIMClient();
      if (!client) {
        return { success: false, message: 'IMClient 未连接' };
      }
      const res = await client.deleteFriend(friendId);
      if (res.code === 0) {
        // 从好友列表中移除（Notify 也会触发，过滤是幂等的）
        set((state) => ({
          friends: state.friends.filter((f) => f.userId !== friendId),
        }));
        return { success: true, message: '已删除好友' };
      }
      return { success: false, message: res.message || '删除失败' };
    } catch (e: any) {
      return { success: false, message: e.message || '删除失败' };
    }
  },

  clearSearchResults: () => set({ searchResults: [] }),
  clearError: () => set({ error: null }),

  clearAll: () => {
    set({ friends: [], pendingRequests: [], searchResults: [], loading: false, error: null });
  },

  // ================================================================
  // Notify 处理器（由 useIMClient 的事件监听调用）
  // ================================================================

  onFriendRequestReceived: (notify: FriendNotify) => {
    set((state) => {
      // 去重：如果已存在相同 userId 的待处理申请，不重复添加
      if (state.pendingRequests.some((r) => r.userId === notify.userId)) {
        return state;
      }
      return {
        pendingRequests: [
          ...state.pendingRequests,
          {
            userId: notify.userId,
            userName: notify.userName || '',
            nickname: notify.nickname,
            avatar: notify.avatar,
            requestedAt: Date.now(),
          },
        ],
      };
    });
  },

  onFriendAccepted: (notify: FriendNotify) => {
    set((state) => {
      // 如果好友列表已有该用户，不重复添加
      if (state.friends.some((f) => f.userId === notify.userId)) {
        return state;
      }
      return {
        friends: [
          ...state.friends,
          {
            userId: notify.userId,
            userName: notify.userName || '',
            nickname: notify.nickname,
            avatar: notify.avatar,
            online: true, // 能推送 Notify 说明对方在线
            friendedAt: Date.now(),
          },
        ],
      };
    });
  },

  onFriendDeleted: (notify: FriendDeleteNotify) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.userId !== notify.userId),
    }));
  },
}));

