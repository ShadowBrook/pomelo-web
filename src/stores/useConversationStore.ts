import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IncomingMessage } from '@/sdk/types';
import { mediaPreview } from '@/sdk/media';

import { ConversationType } from '@/sdk/types';

export interface Conversation {
  peerId: string;
  type: ConversationType;
  nickname: string;
  avatar: string;
  lastMessage: string; // 最后一条消息预览（截断50字）
  lastMessageTime: number;
  lastMessageId?: string; // 最后一条消息 ID，用于去重
  unreadCount: number;
  draft?: string;
  /** 最新未读消息 @ 了我（进会话/清零后消除） */
  mentionedMe?: boolean;
}

interface ConversationState {
  conversations: Record<string, Conversation>;
  activePeerId: string | null;

  setActivePeer: (peerId: string | null) => void;
  clearUnread: (peerId: string) => void;
  updateDraft: (peerId: string, text: string) => void;
  onNewMessage: (msg: IncomingMessage, selfUserId: string) => void;
  createConversation: (peerId: string, nickname?: string, avatar?: string, type?: ConversationType) => void;
  removeConversation: (peerId: string) => void;
  clearAll: () => void;
  getSortedList: () => string[];
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
  conversations: {},
  activePeerId: null,

  setActivePeer: (peerId) => {
    set({ activePeerId: peerId });
    if (peerId) {
      get().clearUnread(peerId);
    }
  },

  clearUnread: (peerId) => {
    set((state) => {
      const conv = state.conversations[peerId];
      if (!conv || (conv.unreadCount === 0 && !conv.mentionedMe)) return state;
      return {
        conversations: {
          ...state.conversations,
          [peerId]: { ...conv, unreadCount: 0, mentionedMe: false },
        },
      };
    });
  },

  updateDraft: (peerId, text) => {
    set((state) => {
      const conv = state.conversations[peerId];
      if (!conv) return state;
      return {
        conversations: {
          ...state.conversations,
          [peerId]: { ...conv, draft: text },
        },
      };
    });
  },

  onNewMessage: (msg, selfUserId) => {
    // 确定 peerId
    const peerId = msg.senderId === selfUserId ? (msg.recipientId ?? '') : msg.senderId;
    const preview = mediaPreview(msg.msgType, msg.content);
    const lastMessage = preview.length > 50 ? preview.slice(0, 50) + '...' : preview;
    const lastMessageTime = msg.createdAt || Date.now();

    set((state) => {
      const existing = state.conversations[peerId];
      // 去重：如果最后一条消息 ID 相同，不更新（避免重复消息导致未读数重复计数）
      if (existing && existing.lastMessageId === msg.id) return state;
      const isSelfActive = state.activePeerId === peerId;

      const conv: Conversation = existing
        ? {
            ...existing,
            lastMessage,
            lastMessageTime,
            lastMessageId: msg.id,
            unreadCount: isSelfActive ? existing.unreadCount : existing.unreadCount + 1,
          }
        : {
            peerId,
            type: 'c2c' as const,
            nickname: msg.senderNickname || msg.senderUserName || peerId,
            avatar: '',
            lastMessage,
            lastMessageTime,
            lastMessageId: msg.id,
            unreadCount: isSelfActive ? 0 : 1,
          };

      return {
        conversations: {
          ...state.conversations,
          [peerId]: conv,
        },
      };
    });
  },

  createConversation: (peerId, nickname, avatar, type = 'c2c') => {
    set((state) => {
      if (state.conversations[peerId]) return state;
      return {
        conversations: {
          ...state.conversations,
          [peerId]: {
            peerId,
            type,
            nickname: nickname || peerId,
            avatar: avatar || '',
            lastMessage: '',
            lastMessageTime: 0,
            unreadCount: 0,
          },
        },
      };
    });
  },

  removeConversation: (peerId) => {
    set((state) => {
      const newConvs = { ...state.conversations };
      delete newConvs[peerId];
      return {
        conversations: newConvs,
        activePeerId: state.activePeerId === peerId ? null : state.activePeerId,
      };
    });
  },

  clearAll: () => {
    set({ conversations: {}, activePeerId: null });
  },

  getSortedList: () => {
    const { conversations } = get();
    return Object.keys(conversations).sort(
      (a, b) => (conversations[b].lastMessageTime || 0) - (conversations[a].lastMessageTime || 0)
    );
  },
}),
    {
      name: 'pomelo-conversations',
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);
