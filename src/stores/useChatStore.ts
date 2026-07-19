import { create } from 'zustand';
import { IncomingMessage, StatusUpdate, MsgType, MessageStatus } from '@/sdk/types';
import { generateId } from '@/sdk/protocol';

// 聊天消息（Store 内部表示）
export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  msgType: MsgType;
  content: string;
  status: MessageStatus;
  timestamp: number; // 服务端时间戳或本地创建时间
  seq?: number;
}

interface ChatState {
  // 按 peerId 分桶的消息列表
  messages: Record<string, ChatMessage[]>;

  // Actions
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
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: {},

  addMessage: (msg: ChatMessage) => {
    set((state) => {
      // 确定 peerId：如果是自己发的，peerId 是 recipientId；如果是收到的，peerId 是 senderId
      const peerId = msg.senderId === '__self__' ? msg.recipientId : msg.senderId;
      const existing = state.messages[peerId] || [];
      // 基于 id 去重
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
      id: msgId,
      senderId: '__self__', // 会被 hooks 层替换为实际 userId
      recipientId: peerId,
      msgType: MsgType.TEXT,
      content: text,
      status: 'sending',
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [peerId]: [...(state.messages[peerId] || []), msg],
      },
    }));
  },

  sendImage: (peerId, file, sendFn) => {
    // 读取文件为 base64
    const reader = new FileReader();
    // 创建一条 failed 状态的消息（用于 onerror / sendFn 异常）
    const createFailedMsg = (): ChatMessage => ({
      id: generateId(),
      senderId: '__self__',
      recipientId: peerId,
      msgType: MsgType.IMAGE,
      content: '',
      status: 'failed',
      timestamp: Date.now(),
    });
    reader.onerror = () => {
      const msg = createFailedMsg();
      set((state) => ({
        messages: {
          ...state.messages,
          [peerId]: [...(state.messages[peerId] || []), msg],
        },
      }));
    };
    reader.onload = () => {
      try {
        const base64 = reader.result as string;
        const msgId = sendFn({ recipientId: peerId, msgType: MsgType.IMAGE, content: base64 });
        const msg: ChatMessage = {
          id: msgId,
          senderId: '__self__',
          recipientId: peerId,
          msgType: MsgType.IMAGE,
          content: base64,
          status: 'sending',
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: {
            ...state.messages,
            [peerId]: [...(state.messages[peerId] || []), msg],
          },
        }));
      } catch {
        // sendFn 抛异常（如未连接），创建 failed 消息
        const msg = createFailedMsg();
        set((state) => ({
          messages: {
            ...state.messages,
            [peerId]: [...(state.messages[peerId] || []), msg],
          },
        }));
      }
    };
    reader.readAsDataURL(file);
  },

  sendFile: (peerId, file, sendFn) => {
    const fileInfo = JSON.stringify({ name: file.name, size: file.size, type: file.type });
    const msgId = sendFn({ recipientId: peerId, msgType: MsgType.FILE, content: fileInfo });
    const msg: ChatMessage = {
      id: msgId,
      senderId: '__self__',
      recipientId: peerId,
      msgType: MsgType.FILE,
      content: fileInfo,
      status: 'sending',
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [peerId]: [...(state.messages[peerId] || []), msg],
      },
    }));
  },

  onIncomingMessage: (msg: IncomingMessage) => {
    // msg 来自 SDK，senderId 是对方 userId
    const chatMsg: ChatMessage = {
      id: msg.id,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      msgType: msg.msgType,
      content: msg.content,
      status: 'delivered', // 收到的消息默认 delivered
      timestamp: msg.createdAt || Date.now(),
      seq: msg.seq,
    };
    // peerId 是 senderId（对方）
    const peerId = msg.senderId;
    set((state) => {
      const existing = state.messages[peerId] || [];
      // 基于 id 去重
      if (existing.some(m => m.id === msg.id)) return state;
      return {
        messages: {
          ...state.messages,
          [peerId]: [...existing, chatMsg].sort((a, b) => a.timestamp - b.timestamp),
        },
      };
    });
  },

  onStatusChange: (update: StatusUpdate) => {
    set((state) => {
      const newMessages = { ...state.messages };
      // 遍历所有桶查找匹配的消息
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
      const msgs = messages[pid] || [];
      for (const msg of msgs) {
        if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
          results.push(msg);
        }
      }
    }
    return results;
  },

  clearMessages: (peerId) => {
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[peerId];
      return { messages: newMessages };
    });
  },

  clearAll: () => {
    set({ messages: {} });
  },

  retryMessage: (messageId, sendFn) => {
    // 查找失败的消息，重新发送并替换为新的 sending 消息
    set((state) => {
      const newMessages = { ...state.messages };
      for (const peerId of Object.keys(newMessages)) {
        const msgs = newMessages[peerId];
        const idx = msgs.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
          const oldMsg = msgs[idx];
          try {
            const newMsgId = sendFn({
              recipientId: oldMsg.recipientId,
              msgType: oldMsg.msgType,
              content: oldMsg.content,
            });
            const updated = [...msgs];
            updated[idx] = {
              ...oldMsg,
              id: newMsgId,
              status: 'sending',
              timestamp: Date.now(),
            };
            newMessages[peerId] = updated;
            return { messages: newMessages };
          } catch {
            // 重新发送仍然失败，保持 failed 状态
            return state;
          }
        }
      }
      return state;
    });
  },
}));
