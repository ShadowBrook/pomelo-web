import { create } from 'zustand';
import { IncomingMessage } from '@/sdk/types';

export interface Conversation {
  peerId: string;
  nickname: string;
  avatar: string;
  lastMessage: string; // 最后一条消息预览（截断50字）
  lastMessageTime: number;
  unreadCount: number;
  draft?: string;
}

interface ConversationState {
  conversations: Record<string, Conversation>;
  activePeerId: string | null;

  setActivePeer: (peerId: string | null) => void;
  clearUnread: (peerId: string) => void;
  updateDraft: (peerId: string, text: string) => void;
  onNewMessage: (msg: IncomingMessage, selfUserId: string) => void;
  createConversation: (peerId: string, nickname?: string, avatar?: string) => void;
  removeConversation: (peerId: string) => void;
  getSortedList: () => string[];
}

export const useConversationStore = create<ConversationState>()((set, get) => ({
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
      if (!conv || conv.unreadCount === 0) return state;
      return {
        conversations: {
          ...state.conversations,
          [peerId]: { ...conv, unreadCount: 0 },
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
    const peerId = msg.senderId === selfUserId ? msg.recipientId : msg.senderId;
    const lastMessage = msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content;
    const lastMessageTime = msg.createdAt || Date.now();

    set((state) => {
      const existing = state.conversations[peerId];
      const isSelfActive = state.activePeerId === peerId;

      const conv: Conversation = existing
        ? {
            ...existing,
            lastMessage,
            lastMessageTime,
            unreadCount: isSelfActive ? existing.unreadCount : existing.unreadCount + 1,
          }
        : {
            peerId,
            nickname: peerId, // 默认用 peerId 作为昵称
            avatar: '',
            lastMessage,
            lastMessageTime,
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

  createConversation: (peerId, nickname, avatar) => {
    set((state) => {
      if (state.conversations[peerId]) return state;
      return {
        conversations: {
          ...state.conversations,
          [peerId]: {
            peerId,
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

  getSortedList: () => {
    const { conversations } = get();
    return Object.keys(conversations).sort(
      (a, b) => (conversations[b].lastMessageTime || 0) - (conversations[a].lastMessageTime || 0)
    );
  },
}));
