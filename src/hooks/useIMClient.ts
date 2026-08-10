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

/**
 * 群聊离线增量同步：用已读水位拉取 seq > lastReadSeq 的新消息。
 * 在重连/首次上线后对每个已加入的群调用（C2C 离线由 client 内部 _pullOfflineMessages 处理）。
 * 不推进已读水位——已读回执由群 ACK 在用户查看消息后更新。
 */
export function syncGroupMessages(groupId: string): void {
  const client = getIMClient();
  if (!client) return;
  const lastReadSeq = useGroupStore.getState().getLastReadSeq(groupId);
  // 无水位（从未同步过）时拉最近历史，否则拉 seq > lastReadSeq 的增量
  const backward = lastReadSeq <= 0;
  const cursor = backward ? 0 : lastReadSeq;
  client.pullGroupMessages(groupId, cursor, 50, backward)
    .then((res) => {
      if (!res || !res.messages || res.messages.length === 0) return;
      const state = useChatStore.getState();
      const existing = state.messages[groupId] || [];
      const existingIds = new Set(existing.map((m) => m.id));
      const fresh = res.messages.filter((m) => !existingIds.has(String(m.id)));
      if (fresh.length === 0) return;
      const newMsgs = fresh.map((m) => ({
        id: String(m.id),
        senderId: m.senderId,
        recipientId: groupId,
        msgType: m.msgType as any,
        content: m.content || '',
        status: 'delivered' as const,
        timestamp: m.createdAt || Date.now(),
        seq: m.seq,
      }));
      useChatStore.setState({
        messages: {
          ...state.messages,
          [groupId]: [...existing, ...newMsgs].sort((a, b) => a.timestamp - b.timestamp),
        },
      });
      // 更新会话最后一条消息 + 未读数
      useConversationStore.setState((s) => {
        const conv = s.conversations[groupId];
        if (!conv) return s;
        const isActive = s.activePeerId === groupId;
        const last = newMsgs[newMsgs.length - 1];
        return {
          conversations: {
            ...s.conversations,
            [groupId]: {
              ...conv,
              lastMessage: (last?.content || '').slice(0, 50),
              lastMessageTime: last?.timestamp || Date.now(),
              lastMessageId: last?.id || '',
              unreadCount: isActive ? 0 : conv.unreadCount + newMsgs.length,
            },
          },
        };
      });
    })
    .catch((err) => console.error(`群聊离线同步失败 groupId=${groupId}:`, err));
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
      if (state === 'connected') {
        // C2C 离线消息由 client 内部 _pullOfflineMessages 处理；
        // 群聊离线增量：重连/首次上线后遍历所有已加入的群同步
        const groups = useGroupStore.getState().groups;
        for (const gid of Object.keys(groups)) {
          syncGroupMessages(gid);
        }
      }
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
      // 群名优先用推送携带的 name，其次群列表缓存；都没有才回退 groupId
      const groupName = msg.name || useGroupStore.getState().groups[groupId]?.name || msg.groupId;
      if (!conv) {
        useConversationStore.getState().createConversation(groupId,
          groupName, '', 'group');
      } else {
        // 直接增量更新群会话（不走 onNewMessage 避免 peerId 算成 sender）
        const isActive = state.activePeerId === groupId;
        const lastMessage = (msg.content || '').slice(0, 50);
        useConversationStore.setState((s) => ({
          conversations: {
            ...s.conversations,
            [groupId]: {
              ...s.conversations[groupId],
              // 修正历史 bug：之前把 groupId 当昵称创建了会话，这里替换为群名
              nickname: s.conversations[groupId].nickname === msg.groupId ? groupName : s.conversations[groupId].nickname,
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
