import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore, ChatMessage } from '@/stores/useChatStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { getIMClient } from '@/hooks/useIMClient';
import { MsgType } from '@/sdk/types';

// 稳定空数组引用，避免 selector 每次返回新数组导致重渲染
const EMPTY_MESSAGES: ChatMessage[] = [];

export interface ReadStatusResult {
  readers: Array<{ userId: string; nickname: string; avatar: string }>;
}

export function useChatSession(peerId: string) {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.userId || '';

  // 窄 selector：只订阅本窗口会话的数据
  const conversation = useConversationStore((s) => s.conversations[peerId] ?? null);
  const messages = useChatStore((s) => s.messages[peerId] ?? EMPTY_MESSAGES);
  const loadingHistory = useChatStore((s) => s.loadingHistory[peerId] ?? false);
  const hasMore = useChatStore((s) => s.hasMoreHistory[peerId] !== false);

  const isGroup = conversation?.type === 'group';

  // 窗口打开 = 会话打开：加载缓存/增量 + 清未读
  useEffect(() => {
    const type = useConversationStore.getState().conversations[peerId]?.type ?? 'c2c';
    useChatStore.getState().openConversation(peerId, type);
    useConversationStore.getState().clearUnread(peerId);
  }, [peerId]);

  // 多窗语义：窗口打开 = 会话可见。未读在 activePeerId 不指向本会话时仍会自增，
  // 这里随消息变化持续清零（clearUnread 在未读为 0 时直接返回，代价为零）
  useEffect(() => {
    useConversationStore.getState().clearUnread(peerId);
  }, [messages, peerId]);

  // C2C 已读回执：对收件消息去重后批量 markSeen
  const markedSeenRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (isGroup) return;
    const incomingIds = messages
      .filter((m) => m.senderId !== currentUserId && m.senderId !== '__self__' && !markedSeenRef.current.has(m.id))
      .map((m) => m.id);
    if (incomingIds.length > 0) {
      incomingIds.forEach((id) => markedSeenRef.current.add(id));
      getIMClient()?.markSeen(incomingIds);
    }
  }, [messages, isGroup, currentUserId]);

  // 群聊已读回执：用他人消息最大 seq 发游标式 ACK
  useEffect(() => {
    if (!isGroup) return;
    const maxSeq = messages
      .filter((m) => m.senderId !== currentUserId && m.senderId !== '__self__')
      .reduce((max, m) => Math.max(max, m.seq || 0), 0);
    if (maxSeq > 0) {
      getIMClient()?.sendGroupAck(peerId, maxSeq);
      useGroupStore.getState().updateLastReadSeq(peerId, maxSeq);
    }
  }, [messages, isGroup, currentUserId, peerId]);

  // 发送路由：按会话类型走 C2C 或群聊
  const sendFn = useCallback(
    (params: { recipientId: string; msgType: MsgType; content: string }) => {
      const client = getIMClient();
      if (!client) throw new Error('IMClient not connected');
      const group = useConversationStore.getState().conversations[peerId]?.type === 'group';
      return group
        ? client.sendGroupMessage(params.recipientId, params.msgType, params.content)
        : client.sendMessage(params);
    },
    [peerId],
  );

  const sendText = useCallback(
    (text: string) => {
      useChatStore.getState().sendText(peerId, text, sendFn);
      useConversationStore.getState().updateDraft(peerId, '');
    },
    [peerId, sendFn],
  );

  const sendMedia = useCallback(
    (opts: { msgType: MsgType; file: File; duration?: number }) => {
      useChatStore.getState().sendMedia(peerId, opts, sendFn);
    },
    [peerId, sendFn],
  );

  const retrySend = useCallback(
    (messageId: string) => {
      useChatStore.getState().retryMessage(messageId, (params) => {
        return sendFn(params);
      });
    },
    [sendFn],
  );

  const loadMoreHistory = useCallback(() => {
    const type = useConversationStore.getState().conversations[peerId]?.type ?? 'c2c';
    useChatStore.getState().loadMoreHistory(peerId, type);
  }, [peerId]);

  const onDraftChange = useCallback(
    (text: string) => {
      useConversationStore.getState().updateDraft(peerId, text);
    },
    [peerId],
  );

  const queryReadStatus = useCallback(
    async (seq: number): Promise<ReadStatusResult> => {
      const client = getIMClient();
      if (!client) return { readers: [] };
      return client.getGroupMsgReadStatus(peerId, seq);
    },
    [peerId],
  );

  return {
    conversation,
    messages,
    currentUserId,
    loadingHistory,
    hasMore,
    loadMoreHistory,
    sendText,
    sendImage: (f: File) => sendMedia({ msgType: MsgType.IMAGE, file: f }),
    sendFile: (f: File) => sendMedia({ msgType: MsgType.FILE, file: f }),
    sendVoice: (f: File, duration?: number) => sendMedia({ msgType: MsgType.VOICE, file: f, duration }),
    sendVideo: (f: File) => sendMedia({ msgType: MsgType.VIDEO, file: f }),
    sendEmoji: (f: File) => sendMedia({ msgType: MsgType.EMOJI, file: f }),
    retrySend,
    draft: conversation?.draft ?? '',
    onDraftChange,
    queryReadStatus,
    isGroup,
  };
}
