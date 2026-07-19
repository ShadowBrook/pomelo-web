import { create } from 'zustand';
import * as api from '@/utils/api';

export interface Friend {
  userId: string;
  nickname: string;
  avatar: string;
  online: boolean;
  friendedAt: number;
}

export interface PendingRequest {
  userId: string; // 申请发起方
  nickname: string;
  avatar: string;
  requestedAt: number;
}

export interface SearchUser {
  userId: string;
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
}

export const useFriendStore = create<FriendState>()((set) => ({
  friends: [],
  pendingRequests: [],
  searchResults: [],
  loading: false,
  error: null,

  loadFriends: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const res = await api.getFriends(userId);
      set({ friends: res.friends || [], loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message || '加载好友列表失败' });
    }
  },

  loadPendingRequests: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const res = await api.getPendingFriends(userId);
      set({ pendingRequests: res.pending || [], loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message || '加载好友申请失败' });
    }
  },

  searchUsers: async (keyword: string) => {
    if (!keyword.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      set({ loading: true, error: null });
      const res = await api.searchUsers(keyword);
      set({ searchResults: res.users || [], loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message || '搜索失败' });
    }
  },

  sendFriendRequest: async (userId: string, friendId: string) => {
    try {
      const res = await api.addFriend(userId, friendId);
      if (res.code === 0) {
        return { success: true, message: '好友申请已发送' };
      }
      return { success: false, message: res.message || '发送失败' };
    } catch (e: any) {
      return { success: false, message: e.message || '发送失败' };
    }
  },

  acceptFriendRequest: async (userId: string, friendId: string) => {
    try {
      const res = await api.acceptFriend(userId, friendId);
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

  removeFriend: async (userId: string, friendId: string) => {
    try {
      const res = await api.removeFriend(userId, friendId);
      if (res.code === 0) {
        // 从好友列表中移除
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
}));
