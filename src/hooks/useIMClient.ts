import { useState, useCallback, useRef, useEffect } from 'react';
import { IMClient } from '@/sdk/client';
import { ConnectionState, IncomingMessage, StatusUpdate, MsgType } from '@/sdk/types';
import type { FriendNotify, FriendDeleteNotify, GroupMessage, GroupMemberChangeNotify } from '@/sdk/types';
import { useChatStore } from '@/stores/useChatStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';

// 模块级单例
let clientInstance: IMClient | null = null;

/**
 * 获取当前 IMClient 单例。
 * 供 Store 在 action 中调用 SDK 方法（避免 Store 直接导入 useIMClient Hook）。
 * 循环依赖安全：useFriendStore 仅在 action 体内部运行时调用此函数，
 * 而非模块加载期；useIMClient 也仅在事件回调中引用 useFriendStore。
 */
export function getIMClient(): IMClient | null {
  return clientInstance;
}

export function useIMClient() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [kickedReason, setKickedReason] = useState<string | null>(null);
  const userIdRef = useRef<string>('');

  const connect = useCallback((userId: string, token: string, userName?: string, nickname?: string) => {
    // 防止重复连接
    if (clientInstance && clientInstance.getState() !== 'disconnected') {
      clientInstance.disconnect();
    }

    userIdRef.current = userId;
    // 重置错误状态
    setErrorMessage(null);
    setKickedReason(null);

    const client = new IMClient({
      url: 'ws://localhost:9001',
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
    });

    // 注册事件监听 —— 使用 getState() 避免闭包捕获旧 state
    client.on('message', (msg: IncomingMessage) => {
      useChatStore.getState().onIncomingMessage(msg);
      useConversationStore.getState().onNewMessage(msg, userId);
    });

    client.on('statusChange', (update: StatusUpdate) => {
      useChatStore.getState().onStatusChange(update);
    });

    client.on('connectionChange', (state: ConnectionState) => {
      setConnectionState(state);
    });

    client.on('kicked', (reason: string) => {
      console.warn('Kicked:', reason);
      setKickedReason(reason);
      // 触发登出
      useAuthStore.getState().logout();
    });

    client.on('authExpired', (reason: string) => {
      console.warn('Auth expired:', reason);
      setKickedReason(reason);
      useAuthStore.getState().logout();
    });

    client.on('error', (err: Error) => {
      console.error('IMClient error:', err);
      setErrorMessage(err.message);
      // 3 秒后清除
      setTimeout(() => setErrorMessage(null), 3000);
    });

    // 好友相关 Notify 事件 —— 桥接到 useFriendStore
    client.on('friendRequest', (notify: FriendNotify) => {
      useFriendStore.getState().onFriendRequestReceived(notify);
    });

    client.on('friendAccepted', (notify: FriendNotify) => {
      useFriendStore.getState().onFriendAccepted(notify);
    });

    client.on('friendDeleted', (notify: FriendDeleteNotify) => {
      useFriendStore.getState().onFriendDeleted(notify);
    });

    // 群聊相关事件
    client.on('groupMessage', (msg: GroupMessage) => {
      const groupId = msg.groupId;
      const state = useConversationStore.getState();
      const conv = state.conversations[groupId];
      if (!conv) {
        useConversationStore.getState().createConversation(groupId,
          msg.groupId, '', 'group');
      } else {
        // 直接增量更新群会话（不走 onNewMessage 避免 peerId 算成 sender）
        const isActive = state.activePeerId === groupId;
        const lastMessage = (msg.content || '').slice(0, 50);
        useConversationStore.setState((s) => ({
          conversations: {
            ...s.conversations,
            [groupId]: {
              ...s.conversations[groupId],
              lastMessage,
              lastMessageTime: msg.createdAt || Date.now(),
              lastMessageId: String(msg.id),
              unreadCount: isActive ? s.conversations[groupId].unreadCount : s.conversations[groupId].unreadCount + 1,
            },
          },
        }));
      }
      // 写入消息到 chat store（key = groupId，不走 addMessage 避免 peerId 算成 sender）
      useChatStore.setState((s) => {
        const existing = s.messages[groupId] || [];
        if (existing.some((m) => m.id === String(msg.id))) return s;
        const newMsg = {
          id: String(msg.id),
          senderId: msg.senderId,
          recipientId: groupId,
          msgType: msg.msgType as any,
          content: msg.content || '',
          status: 'delivered' as const,
          timestamp: msg.createdAt || Date.now(),
          seq: msg.seq,
        };
        return {
          messages: {
            ...s.messages,
            [groupId]: [...existing, newMsg].sort((a, b) => a.timestamp - b.timestamp),
          },
        };
      });
    });

    client.on('groupMemberChange', (notify: GroupMemberChangeNotify) => {
      // 成员变更时刷新群信息
      useGroupStore.getState().removeMember(notify.groupId, notify.userId);
    });

    // 发起连接
    // Fix: 捕获 connect Promise 的 rejection，避免 onerror 触发 reject 时
    // 产生 Uncaught (in promise) Error: WebSocket error
    client.connect(userId, token, userName, nickname).catch((err) => {
      console.error('[useIMClient] connect failed:', err);
      setErrorMessage(err?.message || '连接失败');
    });
    clientInstance = client;
    setConnectionState('connecting');
  }, []);

  const disconnect = useCallback(() => {
    if (clientInstance) {
      clientInstance.disconnect();
      clientInstance = null;
      setConnectionState('disconnected');
    }
  }, []);

  const sendMessage = useCallback((params: { recipientId: string; msgType: MsgType; content: string }) => {
    if (!clientInstance) {
      throw new Error('IMClient not connected');
    }
    return clientInstance.sendMessage(params);
  }, []);

  const markSeen = useCallback((messageIds: string[]) => {
    if (clientInstance) {
      clientInstance.markSeen(messageIds);
    }
  }, []);

  // 重试发送失败的消息：从 chat store 查找原始内容并重新发送
  const retrySend = useCallback((messageId: string) => {
    useChatStore.getState().retryMessage(messageId, (params) => {
      return sendMessage(params);
    });
  }, [sendMessage]);

  // 好友操作：转发到 SDK 单例（供组件直接调用；Store 通过 getIMClient 调用）
  const searchUsers = useCallback((keyword: string) => {
    if (!clientInstance) {
      return Promise.reject(new Error('IMClient not connected'));
    }
    return clientInstance.searchUsers(keyword);
  }, []);

  const addFriend = useCallback((friendId: string) => {
    if (!clientInstance) {
      return Promise.reject(new Error('IMClient not connected'));
    }
    return clientInstance.addFriend(friendId);
  }, []);

  const acceptFriend = useCallback((friendId: string) => {
    if (!clientInstance) {
      return Promise.reject(new Error('IMClient not connected'));
    }
    return clientInstance.acceptFriend(friendId);
  }, []);

  const deleteFriend = useCallback((friendId: string) => {
    if (!clientInstance) {
      return Promise.reject(new Error('IMClient not connected'));
    }
    return clientInstance.deleteFriend(friendId);
  }, []);

  const sendGroupMessage = useCallback((groupId: string, msgType: MsgType, content: string) => {
    if (!clientInstance) throw new Error('IMClient not connected');
    return clientInstance.sendGroupMessage(groupId, msgType, content);
  }, []);

  const pullGroupMessages = useCallback((groupId: string, cursor: number, limit: number, backward: boolean) => {
    if (!clientInstance) throw new Error('IMClient not connected');
    return clientInstance.pullGroupMessages(groupId, cursor, limit, backward);
  }, []);

  const sendGroupAck = useCallback((groupId: string, lastReadSeq: number) => {
    if (clientInstance) clientInstance.sendGroupAck(groupId, lastReadSeq);
  }, []);

  // 组件卸载时断开
  useEffect(() => {
    return () => {
      if (clientInstance) {
        clientInstance.disconnect();
        clientInstance = null;
      }
    };
  }, []);

  return {
    connectionState,
    errorMessage,
    kickedReason,
    connect,
    disconnect,
    sendMessage,
    markSeen,
    retrySend,
    searchUsers,
    addFriend,
    acceptFriend,
    deleteFriend,
    sendGroupMessage,
    pullGroupMessages,
    sendGroupAck,
    client: clientInstance,
  };
}
