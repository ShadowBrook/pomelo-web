import { useState, useCallback, useRef, useEffect } from 'react';
import { IMClient } from '@/sdk/client';
import { ConnectionState, IncomingMessage, StatusUpdate, MsgType } from '@/sdk/types';
import { useChatStore } from '@/stores/useChatStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useAuthStore } from '@/stores/useAuthStore';

// 模块级单例
let clientInstance: IMClient | null = null;

export function useIMClient() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [kickedReason, setKickedReason] = useState<string | null>(null);
  const userIdRef = useRef<string>('');

  const connect = useCallback((userId: string, token: string) => {
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

    client.on('error', (err: Error) => {
      console.error('IMClient error:', err);
      setErrorMessage(err.message);
      // 3 秒后清除
      setTimeout(() => setErrorMessage(null), 3000);
    });

    // 发起连接
    client.connect(userId, token);
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
    client: clientInstance,
  };
}
