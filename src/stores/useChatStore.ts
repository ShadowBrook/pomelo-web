import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IncomingMessage, StatusUpdate, MsgType, MessageStatus, MemberReadState } from '@/sdk/types';
import { generateId } from '@/sdk/protocol';
import { getIMClient } from '@/hooks/useIMClient';
import { useGroupStore } from '@/stores/useGroupStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { buildMediaContent, captureVideoPoster, contentNeedsSignedUrl, isMediaType } from '@/sdk/media';
import { wrapReplyContent } from '@/sdk/media';
import type { ReplySnippet } from '@/sdk/types';

export interface ChatMessage {
  id: string;
  /** 发送确认后 id 会改写为服务端雪花 ID，这里保留原客户端 ID 供后续状态事件匹配 */
  clientMsgId?: string;
  senderId: string;
  recipientId: string;
  senderUserName?: string;
  senderNickname?: string;
  msgType: MsgType;
  content: string;
  status: MessageStatus;
  timestamp: number;
  seq?: number;
  /** 发送方本地媒体预览（object URL），不持久化 */
  localUrl?: string;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  loadingHistory: Record<string, boolean>;
  hasMoreHistory: Record<string, boolean>;
  /** 群成员已读游标：groupId → userId → lastReadSeq（一次拉取全群，仅内存不持久化） */
  groupReadStates: Record<string, Record<string, number>>;

  addMessage: (msg: ChatMessage) => void;
  sendText: (peerId: string, text: string, reply: ReplySnippet | undefined, sendFn: (params: { recipientId: string; msgType: MsgType; content: string }) => string) => void;
  sendMedia: (
    peerId: string,
    params: { msgType: MsgType; file: File; duration?: number; reply?: ReplySnippet },
    sendFn: (params: { recipientId: string; msgType: MsgType; content: string }) => string,
  ) => void;
  /** 发送已构建好的 content（转发等场景）：经 sendFn 投递并乐观写入目标会话列表 */
  sendRaw: (
    peerId: string,
    msgType: MsgType,
    content: string,
    sendFn: (params: { recipientId: string; msgType: MsgType; content: string }) => string,
  ) => void;
  setGroupReadState: (groupId: string, members: MemberReadState[]) => void;
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

/**
 * 清洗持久化消息中的遗留重复：旧版本地发送的消息以客户端生成的 id 持久化，
 * 刷新后历史拉取会再写入同一条消息的服务端 id 副本（两个 id 并存）。
 * seq 由服务端分配；C2C 两个方向各自计数，需按消息方向区分后再判重。
 */
export function sanitizePersistedMessages(
  messages: Record<string, ChatMessage[]>,
  myUserId?: string,
): { messages: Record<string, ChatMessage[]>; changed: boolean } {
  let changed = false;
  const cleaned: Record<string, ChatMessage[]> = {};
  for (const [pid, msgs] of Object.entries(messages)) {
    const seen = new Set<string>();
    cleaned[pid] = msgs.filter((m) => {
      if (m.seq == null || m.seq <= 0) return true;
      const own = m.senderId === '__self__' || (myUserId != null && m.senderId === myUserId);
      const key = `${own ? 'self' : 'peer'}:${m.seq}`;
      if (seen.has(key)) {
        changed = true;
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  return { messages: cleaned, changed };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {},
      loadingHistory: {},
      hasMoreHistory: {},
      groupReadStates: {},

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

      sendText: (peerId, text, reply, sendFn) => {
        // 引用时包装为 REPLY 类型消息（content = {reply: 快照, body: {msgType, content}}）
        const msgType = reply ? MsgType.REPLY : MsgType.TEXT;
        const content = reply ? wrapReplyContent(reply, { msgType: MsgType.TEXT, content: text }) : text;
        const msgId = sendFn({ recipientId: peerId, msgType, content });
        const msg: ChatMessage = {
          id: msgId, senderId: '__self__', recipientId: peerId,
          msgType, content, status: 'sending', timestamp: Date.now(),
        };
        set((state) => ({
          messages: { ...state.messages, [peerId]: [...(state.messages[peerId] || []), msg] },
        }));
      },

      sendRaw: (peerId, msgType, content, sendFn) => {
        const msgId = sendFn({ recipientId: peerId, msgType, content });
        const msg: ChatMessage = {
          id: msgId, senderId: '__self__', recipientId: peerId,
          msgType, content, status: 'sending', timestamp: Date.now(),
        };
        set((state) => ({
          messages: { ...state.messages, [peerId]: [...(state.messages[peerId] || []), msg] },
        }));
      },

      sendMedia: (peerId, params, sendFn) => {
        const { msgType, file, reply } = params;
        const client = getIMClient();

        // 本地预览 object URL；上传/发送失败也保留，让用户看到所选内容
        const localUrl = URL.createObjectURL(file);
        const appendMsg = (extra: Partial<ChatMessage> & { id: string; status: MessageStatus }) =>
          set((s) => ({
            messages: {
              ...s.messages,
              [peerId]: [...(s.messages[peerId] || []), {
                senderId: '__self__' as const,
                recipientId: peerId,
                msgType,
                content: '',
                localUrl,
                timestamp: Date.now(),
                ...extra,
              }],
            },
          }));

        const markFailed = () => appendMsg({ id: generateId(), status: 'failed' });

        if (!client) {
          markFailed();
          return;
        }

        client.requestUpload(msgType, file.name, file.size, file.type || undefined)
          .then(async (resp) => {
            await client.putFileToPresignedUrl(resp.presignedUrl, file);

            // 视频封面：本地抓帧上传为图片对象，key 写入 content.thumb，
            // 服务端读侧签名注入 thumbUrl。失败降级为无封面，不阻断发送。
            let thumb: string | undefined;
            let duration = params.duration;
            if (msgType === MsgType.VIDEO) {
              try {
                const poster = await captureVideoPoster(file);
                if ((duration == null || duration <= 0) && poster.durationMs > 0) {
                  duration = poster.durationMs;
                }
                const posterName = `poster-${Date.now()}.jpg`;
                const posterFile = new File([poster.blob], posterName, { type: 'image/jpeg' });
                const posterResp = await client.requestUpload(
                  MsgType.IMAGE, posterFile.name, posterFile.size, posterFile.type,
                );
                await client.putFileToPresignedUrl(posterResp.presignedUrl, posterFile);
                thumb = posterResp.objectKey;
              } catch (e) {
                console.warn('视频封面上传失败，降级为无封面:', e);
              }
            }

            const content = buildMediaContent({
              key: resp.objectKey, fileName: file.name, size: file.size, duration, thumb,
            });
            const finalType = reply ? MsgType.REPLY : msgType;
            const finalContent = reply ? wrapReplyContent(reply, { msgType, content }) : content;
            const msgId = sendFn({ recipientId: peerId, msgType: finalType, content: finalContent });
            appendMsg({ id: msgId, status: 'sending', content: finalContent });
          })
          .catch((e) => {
            console.error('媒体消息发送失败:', e);
            markFailed();
          });
      },

      setGroupReadState: (groupId, members) => {
        const next: Record<string, number> = {};
        for (const m of members) {
          next[m.userId] = m.lastReadSeq;
        }
        set((s) => ({ groupReadStates: { ...s.groupReadStates, [groupId]: next } }));
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
        let refreshPeer: string | null = null;
        set((state) => {
          const newMessages = { ...state.messages };
          for (const peerId of Object.keys(newMessages)) {
            const msgs = newMessages[peerId];
            const idx = msgs.findIndex((m) => m.id === update.id || m.clientMsgId === update.id);
            if (idx !== -1) {
              const cur = msgs[idx];
              // 转发消息本地 content 不含签名 url：确认送达后拉最新一页刷新（见 openConversation）
              if (update.status === 'sent' && cur.msgType === MsgType.FORWARD) {
                refreshPeer = peerId;
              }
              // 发送确认（sent）携带服务端雪花 ID：把本地生成的 id 改写为服务端 id，
              // 否则刷新后历史拉取按 id 去重匹配不上，自己的消息会重复展示
              const serverId = update.serverMessageId ?? cur.id;
              const updated = [
                ...msgs,
              ];
              updated[idx] = {
                ...cur,
                id: serverId,
                clientMsgId: serverId !== cur.id ? cur.id : cur.clientMsgId,
                status: update.status,
                seq: update.seq ?? updated[idx].seq,
              };
              newMessages[peerId] = updated;
              return { messages: newMessages };
            }
          }
          return state;
        });
        if (refreshPeer) {
          const type = useGroupStore.getState().groups[refreshPeer] ? 'group' : 'c2c';
          void get().openConversation(refreshPeer, type);
        }
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
        const msgs = get().messages[peerId] || [];
        msgs.forEach(m => { if (m.localUrl) URL.revokeObjectURL(m.localUrl); });
        set((s) => { const m = { ...s.messages }; delete m[peerId]; return { messages: m }; });
      },

      clearAll: () => {
        const { messages } = get();
        for (const msgs of Object.values(messages)) {
          msgs.forEach(m => { if (m.localUrl) URL.revokeObjectURL(m.localUrl); });
        }
        set({ messages: {}, hasMoreHistory: {}, loadingHistory: {} });
      },

      loadMoreHistory: async (peerId, type = 'c2c') => {
        const state = get();
        if (state.loadingHistory[peerId]) return;
        if (state.hasMoreHistory[peerId] === false) return;

        const client = getIMClient();
        if (!client) return;

        const msgs = state.messages[peerId] || [];

        // 群聊：用最早消息的 seq 作游标拉更早一页（backward=true）
        if (type === 'group') {
          const oldestSeq = msgs.length > 0 ? (msgs[0].seq ?? 0) : 0;
          if (oldestSeq === 0) return;
          set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: true } }));
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
                loadingHistory: { ...s.loadingHistory, [peerId]: false },
                hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
              };
            });
          } catch (e) {
            set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: false } }));
            console.error('加载群聊历史失败:', e);
          }
          return;
        }

        // 用已拥有最早消息的 createdAt 作时间游标，拉取更早一页（历史接口按 created_at 倒序回退）
        const oldestTime = msgs.length > 0 ? msgs[0].timestamp ?? 0 : 0;
        if (oldestTime === 0) return;

        set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: true } }));
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
              loadingHistory: { ...s.loadingHistory, [peerId]: false },
              hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
            };
          });
        } catch (e) {
          set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: false } }));
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
            set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: true } }));
            try {
              const res = await client.pullGroupMessages(peerId, 0, 50, true);
              const msgs: ChatMessage[] = (res.messages || []).map(m => toChatMessage(m, peerId));
              // backward=true 返回 seq 降序，需反转为正序
              set((s) => ({
                messages: { ...s.messages, [peerId]: msgs.slice().reverse() },
                loadingHistory: { ...s.loadingHistory, [peerId]: false },
                hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
              }));
            } catch (e) {
              set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: false } }));
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
              const idxById = new Map(existing.map((m, i) => [m.id, i]));
              const merged = [...existing];
              let changed = false;
              for (const fm of fresh) {
                const idx = idxById.get(fm.id);
                if (idx === undefined) {
                  merged.push(fm);
                  changed = true;
                } else if (contentNeedsSignedUrl(merged[idx].msgType, merged[idx].content)) {
                  // 已存在但 content 缺签名 url（发送方本地副本）：仅刷新 content，保留本地状态
                  merged[idx] = { ...merged[idx], content: fm.content };
                  changed = true;
                }
              }
              if (!changed) return s;
              return {
                messages: { ...s.messages, [peerId]: merged.sort((a, b) => a.timestamp - b.timestamp) },
              };
            });
          } catch (e) {
            console.error('拉取群聊增量失败:', e);
          }
          return;
        }

        // 首次打开该会话：拉取最近 50 条
        if (cached.length === 0) {
          set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: true } }));
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
              loadingHistory: { ...s.loadingHistory, [peerId]: false },
              hasMoreHistory: { ...s.hasMoreHistory, [peerId]: res.hasMore },
            }));
          } catch (e) {
            set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: false } }));
            console.error('加载历史消息失败:', e);
          }
          return;
        }

        // 有缓存：若存在缺 url 的媒体消息（发送方自己发的，localUrl 未持久化），
        // 后台拉最新一页刷新 presigned url；其余情况直接返回。
        // 新消息已由实时推送(C2C_NOTIFY) + 重连离线同步(pullPending) 投递到 store。
        const needUrlRefresh = cached.some((m) => contentNeedsSignedUrl(m.msgType, m.content));
        if (!needUrlRefresh) return;
        try {
          const res = await client.pullHistory(peerId, 0);
          const fresh = (res.messages || []).map((m) => ({
            id: String(m.id), senderId: m.senderId, recipientId: m.recipientId ?? '',
            senderUserName: m.senderUserName, senderNickname: m.senderNickname,
            msgType: m.msgType as MsgType, content: m.content, status: 'seen' as MessageStatus,
            timestamp: m.createdAt || Date.now(), seq: m.seq,
          }));
          set((s) => {
            const existing = s.messages[peerId] || [];
            const merged = [...existing];
            for (const fm of fresh) {
              const idx = merged.findIndex((m) => m.id === fm.id);
              if (idx >= 0) {
                // 仅刷新 content（含签名 url），保留本地发送状态
                merged[idx] = { ...merged[idx], content: fm.content };
              } else {
                merged.push(fm);
              }
            }
            merged.sort((a, b) => a.timestamp - b.timestamp);
            return { messages: { ...s.messages, [peerId]: merged } };
          });
        } catch (e) {
          console.error('刷新媒体签名失败:', e);
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
              // 媒体上传失败（无 content）时无法原地重试，跳过
              if (isMediaType(oldMsg.msgType) && !oldMsg.content) return state;
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
        // localUrl 是会话内存活的 object URL，刷新后失效，不持久化
        messages: Object.fromEntries(
          Object.entries(state.messages).map(([pid, msgs]) => [
            pid,
            msgs.map(({ localUrl, ...rest }) => rest),
          ]),
        ),
        hasMoreHistory: state.hasMoreHistory,
      }),
      // 历史版本遗留清洗：见 sanitizePersistedMessages 注释
      onRehydrateStorage: () => (state) => {
        if (!state?.messages) return;
        const myId = useAuthStore.getState().user?.userId;
        const { messages: cleaned, changed } = sanitizePersistedMessages(state.messages, myId);
        if (changed) useChatStore.setState({ messages: cleaned });
      },
    }
  )
);
