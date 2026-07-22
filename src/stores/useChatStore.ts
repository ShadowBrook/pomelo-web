import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IncomingMessage, StatusUpdate, MsgType, MessageStatus } from '@/sdk/types';
import { generateId } from '@/sdk/protocol';
import { getIMClient } from '@/hooks/useIMClient';

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  msgType: MsgType;
  content: string;
  status: MessageStatus;
  timestamp: number;
  seq?: number;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  loadingHistory: boolean;
  hasMoreHistory: Record<string, boolean>;

  addMessage: (msg: ChatMessage) => void;
  sendText: (peerId: string, text: string, sendFn: (params: { recipientId: string; msgType: MsgType; content: string }) => string) => void;
  sendImage: (peerId: string, file: File, sendFn: (params: { recipientId: string; msgType: MsgType; content: string }) => string) => void;
  sendFile: (peerId: string, file: File, sendFn: (params: { recipientId: string; msgType: MsgType; content: string }) => string) => void;
  onIncomingMessage: (msg: IncomingMessage) => void;
  onStatusChange: (update: StatusUpdate) => void;
  searchMessages: (keyword: string, peerId?: string) => ChatMessage[];
  clearMessages: (peerId: string) => void;
  clearAll: () => void;
  retryMessage: (
    messageId: string,
    sendFn: (params: { recipientId: string; msgType: MsgType; content: string }) => string,
  ) => void;
  /** 打开会话时调用：有缓存则直接显示，同时拉取增量；无缓存则全量拉取 */
  openConversation: (peerId: string) => Promise<void>;
  /** 滚动到顶加载更早历史 */
  loadMoreHistory: (peerId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {},
      loadingHistory: false,
      hasMoreHistory: {},

      addMessage: (msg: ChatMessage) => {
        set((state) => {
          const peerId = msg.senderId === '__self__' ? msg.recipientId : msg.senderId;
          const existing = state.messages[peerId] || [];
          if (existing.some(m => m.id === msg.id)) return state;
          return {
            messages: {
              ...state.messages,
              [peerId]: [...existing, msg].sort((a, b) => a.timestamp - b.timestamp),
            },
          };
        });
      },

      sendText: (peerId, text, sendFn) => {
        const msgId = sendFn({ recipientId: peerId, msgType: MsgType.TEXT, content: text });
        const msg: ChatMessage = {
          id: msgId, senderId: '__self__', recipientId: peerId,
          msgType: MsgType.TEXT, content: text, status: 'sending', timestamp: Date.now(),
        };
        set((state) => ({
          messages: { ...state.messages, [peerId]: [...(state.messages[peerId] || []), msg] },
        }));
      },

      sendImage: (peerId, file, sendFn) => {
        const createFailedMsg = (): ChatMessage => ({
          id: generateId(), senderId: '__self__', recipientId: peerId,
          msgType: MsgType.IMAGE, content: '', status: 'failed', timestamp: Date.now(),
        });
        const reader = new FileReader();
        reader.onerror = () => set((s) => ({ messages: { ...s.messages, [peerId]: [...(s.messages[peerId] || []), createFailedMsg()] } }));
        reader.onload = () => {
          try {
            const base64 = reader.result as string;
            const msgId = sendFn({ recipientId: peerId, msgType: MsgType.IMAGE, content: base64 });
            const msg: ChatMessage = { id: msgId, senderId: '__self__', recipientId: peerId, msgType: MsgType.IMAGE, content: base64, status: 'sending', timestamp: Date.now() };
            set((s) => ({ messages: { ...s.messages, [peerId]: [...(s.messages[peerId] || []), msg] } }));
          } catch { set((s) => ({ messages: { ...s.messages, [peerId]: [...(s.messages[peerId] || []), createFailedMsg()] } })); }
        };
        reader.readAsDataURL(file);
      },

      sendFile: (peerId, file, sendFn) => {
        const fileInfo = JSON.stringify({ name: file.name, size: file.size, type: file.type });
        const msgId = sendFn({ recipientId: peerId, msgType: MsgType.FILE, content: fileInfo });
        const msg: ChatMessage = { id: msgId, senderId: '__self__', recipientId: peerId, msgType: MsgType.FILE, content: fileInfo, status: 'sending', timestamp: Date.now() };
        set((s) => ({ messages: { ...s.messages, [peerId]: [...(s.messages[peerId] || []), msg] } }));
      },

      onIncomingMessage: (msg: IncomingMessage) => {
        const chatMsg: ChatMessage = {
          id: msg.id, senderId: msg.senderId, recipientId: msg.recipientId,
          msgType: msg.msgType, content: msg.content, status: 'delivered',
          timestamp: msg.createdAt || Date.now(), seq: msg.seq,
        };
        const peerId = msg.senderId;
        set((state) => {
          const existing = state.messages[peerId] || [];
          if (existing.some(m => m.id === msg.id)) return state;
          return { messages: { ...state.messages, [peerId]: [...existing, chatMsg].sort((a, b) => a.timestamp - b.timestamp) } };
        });
      },

      onStatusChange: (update: StatusUpdate) => {
        set((state) => {
          const newMessages = { ...state.messages };
          for (const peerId of Object.keys(newMessages)) {
            const msgs = newMessages[peerId];
            const idx = msgs.findIndex(m => m.id === update.id);
            if (idx !== -1) {
              const updated = [...msgs];
              updated[idx] = { ...updated[idx], status: update.status, seq: update.seq ?? updated[idx].seq };
              newMessages[peerId] = updated;
              return { messages: newMessages };
            }
          }
          return state;
        });
      },

      searchMessages: (keyword, peerId) => {
        const { messages } = get();
        const results: ChatMessage[] = [];
        const searchIn = peerId ? [peerId] : Object.keys(messages);
        for (const pid of searchIn) {
          for (const msg of messages[pid] || []) {
            if (msg.content.toLowerCase().includes(keyword.toLowerCase())) results.push(msg);
          }
        }
        return results;
      },

      clearMessages: (peerId) => {
        set((s) => { const m = { ...s.messages }; delete m[peerId]; return { messages: m }; });
      },

      clearAll: () => set({ messages: {}, hasMoreHistory: {}, loadingHistory: false }),

      loadMoreHistory: async (peerId) => {
        const state = get();
        if (state.loadingHistory) return;
        if (state.hasMoreHistory[peerId] === false) return;

        const client = getIMClient();
        if (!client) return;

        const msgs = state.messages[peerId] || [];
        // use oldest seq as beforeSeq to get messages before what we have
        const oldestSeq = msgs.length > 0 ? msgs[0].seq ?? 0 : 0;
        if (oldestSeq === 0) return;

        set({ loadingHistory: true });
        try {
          const res = await client.pullHistory(peerId, oldestSeq);
          const historyMsgs: ChatMessage[] = (res.messages || []).map(m => ({
            id: String(m.id), senderId: m.senderId, recipientId: m.recipientId,
            msgType: m.msgType as MsgType, content: m.content, status: 'seen' as MessageStatus,
            timestamp: m.createdAt || Date.now(), seq: m.seq,
          }));

          set((s) => {
            const existing = s.messages[peerId] || [];
            const existingIds = new Set(existing.map(m => m.id));
            const newMsgs = historyMsgs.filter(m => !existingIds.has(m.id));
            const merged = [...newMsgs, ...existing].sort((a, b) => a.timestamp - b.timestamp);
            return {
              messages: { ...s.messages, [peerId]: merged },
              loadingHistory: false,
              hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
            };
          });
        } catch (e) {
          set({ loadingHistory: false });
          console.error('加载历史消息失败:', e);
        }
      },

      /** 打开会话：有缓存直接显示 + 后台拉增量 */
      openConversation: async (peerId) => {
        const state = get();
        const cached = state.messages[peerId] || [];

        const client = getIMClient();
        if (!client) return;

        // 计算本地最大 seq，用做拉取起点（只拉更新的消息）
        const maxSeq = cached.reduce((max, m) => m.seq && m.seq > max ? m.seq : max, 0);

        // 首次打开该会话：拉取最近 50 条
        if (cached.length === 0) {
          set({ loadingHistory: true });
          try {
            const res = await client.pullHistory(peerId, 0);
            const msgs: ChatMessage[] = (res.messages || []).map(m => ({
              id: String(m.id), senderId: m.senderId, recipientId: m.recipientId,
              msgType: m.msgType as MsgType, content: m.content, status: 'seen' as MessageStatus,
              timestamp: m.createdAt || Date.now(), seq: m.seq,
            }));
            set((s) => ({
              messages: { ...s.messages, [peerId]: msgs.sort((a, b) => a.timestamp - b.timestamp) },
              loadingHistory: false,
              hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
            }));
          } catch (e) {
            set({ loadingHistory: false });
            console.error('加载历史消息失败:', e);
          }
          return;
        }

        // 有缓存：后台静默拉取增量（更新于 maxSeq 的消息）
        if (maxSeq > 0) {
          try {
            const res = await client.pullHistory(peerId, maxSeq);
            if (res.messages && res.messages.length > 0) {
              const deltaMsgs: ChatMessage[] = res.messages.map(m => ({
                id: String(m.id), senderId: m.senderId, recipientId: m.recipientId,
                msgType: m.msgType as MsgType, content: m.content, status: 'seen' as MessageStatus,
                timestamp: m.createdAt || Date.now(), seq: m.seq,
              }));
              set((s) => {
                const existing = s.messages[peerId] || [];
                const existingIds = new Set(existing.map(m => m.id));
                const newMsgs = deltaMsgs.filter(m => !existingIds.has(m.id));
                if (newMsgs.length === 0) return s;
                const merged = [...newMsgs, ...existing].sort((a, b) => a.timestamp - b.timestamp);
                return { messages: { ...s.messages, [peerId]: merged } };
              });
            }
          } catch (e) {
            console.error('拉取增量消息失败:', e);
          }
        }
      },

      retryMessage: (messageId, sendFn) => {
        set((state) => {
          const newMessages = { ...state.messages };
          for (const peerId of Object.keys(newMessages)) {
            const msgs = newMessages[peerId];
            const idx = msgs.findIndex((m) => m.id === messageId);
            if (idx !== -1) {
              const oldMsg = msgs[idx];
              try {
                const newMsgId = sendFn({ recipientId: oldMsg.recipientId, msgType: oldMsg.msgType, content: oldMsg.content });
                const updated = [...msgs];
                updated[idx] = { ...oldMsg, id: newMsgId, status: 'sending', timestamp: Date.now() };
                newMessages[peerId] = updated;
                return { messages: newMessages };
              } catch { return state; }
            }
          }
          return state;
        });
      },
    }),
    {
      name: 'pomelo-chat',
      partialize: (state) => ({
        messages: state.messages,
        hasMoreHistory: state.hasMoreHistory,
      }),
    }
  )
);
