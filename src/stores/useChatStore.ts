import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IncomingMessage, StatusUpdate, MsgType, MessageStatus } from '@/sdk/types';
import { generateId } from '@/sdk/protocol';
import { getIMClient } from '@/hooks/useIMClient';
import { useGroupStore } from '@/stores/useGroupStore';

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  senderUserName?: string;
  senderNickname?: string;
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
  openConversation: (peerId: string, type?: 'c2c' | 'group') => Promise<void>;
  /** 滚动到顶加载更早历史 */
  loadMoreHistory: (peerId: string, type?: 'c2c' | 'group') => Promise<void>;
}

/** 归一化拉取回来的消息为 ChatMessage（群聊无 recipientId 字段，fallback 到 peerId） */
function toChatMessage(m: IncomingMessage, peerId: string): ChatMessage {
  return {
    id: String(m.id),
    senderId: m.senderId,
    recipientId: m.recipientId ?? peerId,
    senderUserName: m.senderUserName,
    senderNickname: m.senderNickname,
    msgType: m.msgType,
    content: m.content || '',
    status: 'seen' as MessageStatus,
    timestamp: m.createdAt || Date.now(),
    seq: m.seq,
  };
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
          id: msg.id, senderId: msg.senderId, recipientId: msg.recipientId ?? '',
          senderUserName: msg.senderUserName, senderNickname: msg.senderNickname,
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

      loadMoreHistory: async (peerId, type = 'c2c') => {
        const state = get();
        if (state.loadingHistory) return;
        if (state.hasMoreHistory[peerId] === false) return;

        const client = getIMClient();
        if (!client) return;

        const msgs = state.messages[peerId] || [];

        // 群聊：用最早消息的 seq 作游标拉更早一页（backward=true）
        if (type === 'group') {
          const oldestSeq = msgs.length > 0 ? (msgs[0].seq ?? 0) : 0;
          if (oldestSeq === 0) return;
          set({ loadingHistory: true });
          try {
            const res = await client.pullGroupMessages(peerId, oldestSeq, 50, true);
            const historyMsgs: ChatMessage[] = (res.messages || []).map(m => toChatMessage(m, peerId));
            set((s) => {
              const existing = s.messages[peerId] || [];
              const existingIds = new Set(existing.map(m => m.id));
              // backward=true 返回 seq 降序，反转为正序后前置
              const newMsgs = historyMsgs.filter(m => !existingIds.has(m.id)).reverse();
              const merged = [...newMsgs, ...existing].sort((a, b) => a.timestamp - b.timestamp);
              return {
                messages: { ...s.messages, [peerId]: merged },
                loadingHistory: false,
                hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
              };
            });
          } catch (e) {
            set({ loadingHistory: false });
            console.error('加载群聊历史失败:', e);
          }
          return;
        }

        // 用已拥有最早消息的 createdAt 作时间游标，拉取更早一页（历史接口按 created_at 倒序回退）
        const oldestTime = msgs.length > 0 ? msgs[0].timestamp ?? 0 : 0;
        if (oldestTime === 0) return;

        set({ loadingHistory: true });
        try {
          const res = await client.pullHistory(peerId, oldestTime);
          const historyMsgs: ChatMessage[] = (res.messages || []).map(m => ({
            id: String(m.id), senderId: m.senderId, recipientId: m.recipientId ?? '',
            senderUserName: m.senderUserName, senderNickname: m.senderNickname,
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
      openConversation: async (peerId, type = 'c2c') => {
        const state = get();
        const cached = state.messages[peerId] || [];

        const client = getIMClient();
        if (!client) return;

        // 群聊：消息在 im_message_group 表，历史/增量都走 pullGroupMessages
        if (type === 'group') {
          if (cached.length === 0) {
            // 首次打开：拉最近一页历史垫底
            set({ loadingHistory: true });
            try {
              const res = await client.pullGroupMessages(peerId, 0, 50, true);
              const msgs: ChatMessage[] = (res.messages || []).map(m => toChatMessage(m, peerId));
              // backward=true 返回 seq 降序，需反转为正序
              set((s) => ({
                messages: { ...s.messages, [peerId]: msgs.slice().reverse() },
                loadingHistory: false,
                hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
              }));
            } catch (e) {
              set({ loadingHistory: false });
              console.error('加载群聊历史失败:', e);
            }
            return;
          }
          // 有缓存：用已读水位拉增量（seq > lastReadSeq）；无水位则拉最近历史。
          // 拉取不推进水位——已读水位由群 ACK 在用户查看消息后更新。
          const lastReadSeq = useGroupStore.getState().getLastReadSeq(peerId);
          const backward = lastReadSeq <= 0;
          const cursor = backward ? 0 : lastReadSeq;
          try {
            const res = await client.pullGroupMessages(peerId, cursor, 50, backward);
            const fresh: ChatMessage[] = (res.messages || []).map(m => toChatMessage(m, peerId));
            set((s) => {
              const existing = s.messages[peerId] || [];
              const existingIds = new Set(existing.map(m => m.id));
              const added = fresh.filter(m => !existingIds.has(m.id));
              if (added.length === 0) return s;
              return {
                messages: { ...s.messages, [peerId]: [...existing, ...added].sort((a, b) => a.timestamp - b.timestamp) },
              };
            });
          } catch (e) {
            console.error('拉取群聊增量失败:', e);
          }
          return;
        }

        // 首次打开该会话：拉取最近 50 条
        if (cached.length === 0) {
          set({ loadingHistory: true });
          try {
            const res = await client.pullHistory(peerId, 0);
            const msgs: ChatMessage[] = (res.messages || []).map(m => ({
              id: String(m.id), senderId: m.senderId, recipientId: m.recipientId ?? '',
              senderUserName: m.senderUserName, senderNickname: m.senderNickname,
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

        // 有缓存：直接返回。新消息已由实时推送(C2C_NOTIFY) + 重连离线同步(pullPending)
        // 投递到 store；历史接口按 created_at 只回退不前进，无法增量拉"更新于某点"的消息。
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
