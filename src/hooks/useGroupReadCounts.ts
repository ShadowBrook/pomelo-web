import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getIMClient } from '@/hooks/useIMClient';
import { useChatStore, ChatMessage } from '@/stores/useChatStore';

/** 会话打开期间的周期性刷新间隔（单次请求覆盖全群，成本低） */
const POLL_INTERVAL_MS = 30000;
/** 自己发出消息后的短轮询时刻（他人读完能较快反映） */
const SEND_POLL_DELAYS_MS = [3000, 8000, 15000];

/**
 * 群聊已读人数：**每群一次**拉取成员已读游标（groupId → userId → lastReadSeq），
 * 客户端本地推导每条消息的已读人数（lastReadSeq >= seq 的成员数，不含自己）。
 * 刷新时机：打开会话、窗口聚焦、自己发出新消息后短轮询、会话打开期间每 30s。
 * 相比按消息逐条查询（O(N) 请求），这里是 O(1) 请求 + 本地计算。
 */
export function useGroupReadCounts(
  peerId: string,
  isGroup: boolean,
  messages: ChatMessage[],
  currentUserId: string,
): Record<number, number> {
  const state = useChatStore((st) => st.groupReadStates[peerId]);
  const setGroupReadState = useChatStore((st) => st.setGroupReadState);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // 同一时刻只允许一次状态请求
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    const client = getIMClient();
    if (!client || inFlight.current) return;
    inFlight.current = true;
    try {
      const resp = await client.getGroupReadState(peerId);
      setGroupReadState(peerId, resp.members || []);
    } catch {
      // 忽略，下次刷新重试
    } finally {
      inFlight.current = false;
    }
  }, [peerId, setGroupReadState]);

  // 打开会话 / 切换群：拉取一次
  useEffect(() => {
    if (isGroup) {
      void refresh();
    }
  }, [isGroup, refresh]);

  // 会话打开期间周期刷新（单次请求覆盖全群）
  useEffect(() => {
    if (!isGroup) return;
    const timer = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isGroup, refresh]);

  // 窗口重新聚焦：他人可能刚读
  useEffect(() => {
    if (!isGroup) return;
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isGroup, refresh]);

  // 自己发出新消息后短轮询
  const newestSeqRef = useRef(0);
  const pollTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (!isGroup) return;
    const own = messages.filter(
      (m) => (m.senderId === '__self__' || m.senderId === currentUserId) && (m.seq ?? 0) > 0,
    );
    const seq = own.length > 0 ? own[own.length - 1].seq! : 0;
    if (seq <= 0 || seq === newestSeqRef.current) return;
    newestSeqRef.current = seq;
    pollTimers.current.forEach(clearTimeout);
    pollTimers.current = SEND_POLL_DELAYS_MS.map((ms) =>
      setTimeout(() => {
        void refresh();
      }, ms),
    );
  }, [isGroup, messages, refresh, currentUserId]);
  useEffect(() => () => { pollTimers.current.forEach(clearTimeout); }, []);

  // 本地推导：每条自己发的消息 → 除自己外 lastReadSeq >= seq 的成员数
  return useMemo(() => {
    if (!isGroup || !state) return {};
    const others = Object.entries(state).filter(([userId]) => userId !== currentUserId);
    const counts: Record<number, number> = {};
    for (const m of messages) {
      const seq = m.seq ?? 0;
      if (seq <= 0) continue;
      if (m.senderId !== '__self__' && m.senderId !== currentUserId) continue;
      counts[seq] = others.reduce((n, [, lastReadSeq]) => n + (lastReadSeq >= seq ? 1 : 0), 0);
    }
    return counts;
  }, [isGroup, state, messages, currentUserId]);
}
