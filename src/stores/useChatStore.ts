import { create } from 'zustand';
import { IncomingMessage, StatusUpdate, MsgType, MessageStatus, MemberReadState } from '@/sdk/types';
import { generateId } from '@/sdk/protocol';
import { getIMClient } from '@/hooks/useIMClient';
import { useGroupStore } from '@/stores/useGroupStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import {
  LOCAL_PAGE,
  hydrateChat,
  loadOlderFromDb,
  markHydration,
  persistMessagesDiff,
  saveSnapshot,
  seedPersisted,
  wipeChatCache,
} from '@/utils/chatCache';
import { buildMediaContent, captureVideoPoster, contentNeedsSignedUrl, isMediaType, makeImageThumbnail } from '@/sdk/media';
import { wrapReplyContent } from '@/sdk/media';
import type { ReplySnippet } from '@/sdk/types';

export interface ChatMessage {
  id: string;
  /** 发送确认后 id 会改写为服务端雪花 ID，这里保留原客户端 ID 供后续状态事件匹配 */
  clientMsgId?: string;
  /** 媒体上传进度 0..100；非空表示正在上传（气泡显示百分比） */
  uploadProgress?: number;
  senderId: string;
  recipientId: string;
  senderUserName?: string;
  senderNickname?: string;
  /** 被 @ 的用户 ID 列表（群消息元数据） */
  mentions?: string[];
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
  sendText: (peerId: string, text: string, reply: ReplySnippet | undefined, sendFn: (params: { recipientId: string; msgType: MsgType; content: string; ext?: Record<string, string> }) => string, mentionIds?: string[]) => void;
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
  /** 登录后从 IndexedDB 恢复各会话最近一页（先本地、后网络） */
  hydrateFromDb: () => Promise<void>;
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

/**
 * 群聊增量同步游标：**本地最大 seq**。
 *
 * 不用服务端已读水位做游标：水位是「读到哪里」，可能被别的端推进到本地消息之前，
 * 一旦水位 > 本地最大 seq，中间的缺口会被永久跳过（安卓那边踩过这个坑）。
 * 本地最大 seq 是「我手里有什么」，从它往后拉只会重复、不会漏；本地没有则拉最近一页
 * （forward 从 0 会拿到群最早的消息，不是想要的）。
 */
export function groupPullCursor(messages: ChatMessage[]): { cursor: number; backward: boolean } {
  const localMax = messages.reduce((max, m) => Math.max(max, m.seq || 0), 0);
  return localMax > 0 ? { cursor: localMax, backward: false } : { cursor: 0, backward: true };
}

/**
 * 账号级离线水位：本地收到的消息里最大的 seq（**收件箱 seq 是按收件人单调分配的**，
 * 所以这个最大值就是「我同步到哪里」）。登录时交给 SDK 作 pullPending 的起始游标，
 * 刷新页面后不必把收件箱从第一条拉一遍。
 *
 * 注意排除自己发的消息：自己的消息 seq 是「给对方分配的序号」，不属于我的收件箱。
 */
export function localInboxWatermark(myUserId: string): number {
  const { messages } = useChatStore.getState();
  const conversations = useConversationStore.getState().conversations;
  let max = 0;
  for (const [peerId, list] of Object.entries(messages)) {
    // 群消息 seq 是群内计数，与账号收件箱无关
    if (conversations[peerId]?.type === 'group') continue;
    for (const msg of list) {
      if (!msg.seq || msg.seq <= max) continue;
      if (msg.senderId === myUserId || msg.senderId === '__self__') continue;
      max = msg.seq;
    }
  }
  return max;
}

/** 本地数据已翻到底的会话：不再查本地库，直接走服务端 */
const localExhausted = new Set<string>();

/**
 * 服务端已确认「该会话没有更早历史」的会话（跨刷新保留）。
 * 只在用户真的滚到最早那条之后才会用到，避免每次打开都为「还有更早的吗」再问一次。
 */
const serverExhausted = new Set<string>();

/** serverExhausted 快照的去抖定时器 */
let exhaustedTimer: ReturnType<typeof setTimeout> | null = null;

function markServerExhausted(peerId: string, done: boolean): void {
  if (done) serverExhausted.add(peerId);
  else serverExhausted.delete(peerId);
  if (exhaustedTimer) clearTimeout(exhaustedTimer);
  exhaustedTimer = setTimeout(() => {
    exhaustedTimer = null;
    const snap: Record<string, boolean> = {};
    for (const id of serverExhausted) snap[id] = true;
    void saveSnapshot('serverExhausted', snap);
  }, 300);
}

let hydratePromise: Promise<void> | null = null;

export const useChatStore = create<ChatState>()(
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

      sendText: (peerId, text, reply, sendFn, mentionIds) => {
        // 引用时包装为 REPLY 类型消息（content = {reply: 快照, body: {msgType, content}}）
        const msgType = reply ? MsgType.REPLY : MsgType.TEXT;
        const content = reply ? wrapReplyContent(reply, { msgType: MsgType.TEXT, content: text }) : text;
        const msgId = sendFn({
          recipientId: peerId,
          msgType,
          content,
          ext: mentionIds && mentionIds.length > 0 ? { mentioned_user_ids: mentionIds.join(',') } : undefined,
        });
        const msg: ChatMessage = {
          id: msgId, senderId: '__self__', recipientId: peerId,
          msgType, content, status: 'sending', timestamp: Date.now(),
          mentions: mentionIds && mentionIds.length > 0 ? mentionIds : undefined,
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
        // 占位气泡立即出现（含本地预览 + 进度），让用户在上传期间就看到「发送中」
        const placeholderId = generateId();
        const placeholderAt = Date.now();
        set((s) => ({
          messages: {
            ...s.messages,
            [peerId]: [...(s.messages[peerId] || []), {
              id: placeholderId,
              senderId: '__self__' as const,
              recipientId: peerId,
              msgType,
              content: '',
              localUrl,
              timestamp: placeholderAt,
              status: 'sending' as MessageStatus,
              uploadProgress: 0,
            }],
          },
        }));

        /** 就地更新占位气泡（进度 / 失败） */
        const patchPlaceholder = (extra: Partial<ChatMessage>) =>
          set((s) => ({
            messages: {
              ...s.messages,
              [peerId]: (s.messages[peerId] || []).map((m) =>
                m.id === placeholderId ? { ...m, ...extra } : m,
              ),
            },
          }));

        /** 上传完成：占位气泡换成真实消息（保留本地预览与时间戳，位置不跳动） */
        const finishPlaceholder = (id: string, content: string) =>
          set((s) => ({
            messages: {
              ...s.messages,
              [peerId]: (s.messages[peerId] || []).map((m) =>
                m.id === placeholderId
                  ? { ...m, id, content, status: 'sending' as MessageStatus, uploadProgress: undefined }
                  : m,
              ),
            },
          }));

        const markFailed = () => patchPlaceholder({ status: 'failed' as MessageStatus, uploadProgress: undefined });

        if (!client) {
          markFailed();
          return;
        }

        client.requestUpload(msgType, file.name, file.size, file.type || undefined)
          .then(async (resp) => {
            await client.putFileToPresignedUrl(resp.presignedUrl, file, (sent, total) => {
              const pct = total > 0 ? Math.round((sent * 100) / total) : 0;
              patchPlaceholder({ uploadProgress: pct });
            });

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

            // 图片缩略图：长边 ≤480 的 JPEG 小图。接收端先加载小图让消息秒出，
            // 点开大图时才请求原图（key 存 content.thumb，服务端读侧签名注入 thumbUrl）。
            if (msgType === MsgType.IMAGE && !thumb) {
              try {
                const thumbBlob = await makeImageThumbnail(file);
                if (thumbBlob) {
                  const thumbFile = new File([thumbBlob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
                  const tr = await client.requestUpload(
                    MsgType.IMAGE, thumbFile.name, thumbFile.size, thumbFile.type,
                  );
                  await client.putFileToPresignedUrl(tr.presignedUrl, thumbFile);
                  thumb = tr.objectKey;
                }
              } catch (e) {
                console.warn('图片缩略图上传失败，降级为原图:', e);
              }
            }

            const content = buildMediaContent({
              key: resp.objectKey, fileName: file.name, size: file.size, duration, thumb,
            });
            const finalType = reply ? MsgType.REPLY : msgType;
            const finalContent = reply ? wrapReplyContent(reply, { msgType, content }) : content;
            const msgId = sendFn({ recipientId: peerId, msgType: finalType, content: finalContent });
            finishPlaceholder(msgId, finalContent);
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
        // 多端同步：senderId == 本机账号 的是「自己消息的回推」（另一端发送/服务端回推），
        // 归档到收件人（即对端）会话，其余按发送者归档
        const selfId = useAuthStore.getState().user?.userId;
        const isOwnEcho = !!msg.senderId && msg.senderId === selfId;
        const peerId = isOwnEcho ? (msg.recipientId || msg.senderId) : msg.senderId;
        const chatMsg: ChatMessage = {
          id: msg.id, senderId: msg.senderId, recipientId: msg.recipientId ?? '',
          senderUserName: msg.senderUserName, senderNickname: msg.senderNickname,
          msgType: msg.msgType, content: msg.content, status: 'delivered',
          timestamp: msg.createdAt || Date.now(), seq: msg.seq,
        };
        set((state) => {
          const existing = state.messages[peerId] || [];
          // 按 id 或 clientMsgId 合并：clientMsgId 命中说明本地乐观气泡已在
          // （服务端回推先于 C2C_RESP 到达的竞态），原地替换 id，不新增气泡
          const idx = existing.findIndex(
            (m) => m.id === msg.id
              || (!!msg.clientMsgId && (m.id === msg.clientMsgId || m.clientMsgId === msg.clientMsgId)),
          );
          if (idx !== -1) {
            const cur = existing[idx];
            const merged: ChatMessage = {
              ...cur,
              id: msg.id,
              clientMsgId: cur.clientMsgId ?? msg.clientMsgId,
              seq: msg.seq || cur.seq,
              status: cur.status === 'sending' ? 'sent' : cur.status,
            };
            const next = [...existing];
            next[idx] = merged;
            return { messages: { ...state.messages, [peerId]: next } };
          }
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
              // 本地乐观副本的 content 只含对象 key，签名 url 由服务端读侧注入：
              // 媒体消息（含转发）确认送达后拉最新一页补上 url，否则发送方自己的语音/视频
              // 在本地 blob 预览失效（刷新页面、切走会话）后无可加载地址，原生播放器报错
              if (update.status === 'sent'
                && (cur.msgType === MsgType.FORWARD || contentNeedsSignedUrl(cur.msgType, cur.content))) {
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
        localExhausted.delete(peerId);
        set((s) => { const m = { ...s.messages }; delete m[peerId]; return { messages: m }; });
      },

      clearAll: () => {
        const { messages } = get();
        for (const msgs of Object.values(messages)) {
          msgs.forEach(m => { if (m.localUrl) URL.revokeObjectURL(m.localUrl); });
        }
        localExhausted.clear();
        set({ messages: {}, hasMoreHistory: {}, loadingHistory: {} });
        // 登出即清本地库：换账号登录/共用电脑时不能把上一账号的聊天记录留在磁盘上
        void wipeChatCache();
      },

      loadMoreHistory: async (peerId, type = 'c2c') => {
        const state = get();
        if (state.loadingHistory[peerId]) return;
        if (state.hasMoreHistory[peerId] === false) return;

        const client = getIMClient();
        if (!client) return;

        const msgs = state.messages[peerId] || [];

        // 先翻本地库：早就同步下来的历史不必再问服务端（离线时也能翻）。
        // 注意也要走 loadingHistory 的 true→false 周期：MessageList 靠这个信号
        // 复位 prevScrollHeightRef，否则本地翻一页之后就再也触发不了加载更早历史。
        // 本地不足一页说明本地到底了，继续往下走到服务端分支，同一次加载动作里补齐。
        const localCursor = msgs.length > 0 ? msgs[0].timestamp ?? 0 : 0;
        if (localCursor > 0 && !localExhausted.has(peerId)) {
          set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: true } }));
          const local = await loadOlderFromDb(peerId, localCursor, LOCAL_PAGE);
          if (local.length > 0) {
            set((s) => {
              const existing = s.messages[peerId] || [];
              const existingIds = new Set(existing.map((m) => m.id));
              const older = local.filter((m) => !existingIds.has(m.id));
              return {
                messages: older.length === 0
                  ? s.messages
                  : {
                    ...s.messages,
                    [peerId]: [...older, ...existing].sort((a, b) => a.timestamp - b.timestamp),
                  },
                loadingHistory: { ...s.loadingHistory, [peerId]: false },
              };
            });
            if (local.length >= LOCAL_PAGE) return;
          }
          localExhausted.add(peerId);
          // 本地到头 + 服务端此前已确认到头：这个会话真的没有更早的了，收工
          if (serverExhausted.has(peerId)) {
            set((s) => ({
              loadingHistory: { ...s.loadingHistory, [peerId]: false },
              hasMoreHistory: { ...s.hasMoreHistory, [peerId]: false },
            }));
            return;
          }
        } else if (localExhausted.has(peerId) && serverExhausted.has(peerId)) {
          set((s) => ({
            loadingHistory: { ...s.loadingHistory, [peerId]: false },
            hasMoreHistory: { ...s.hasMoreHistory, [peerId]: false },
          }));
          return;
        }

        // 服务端分支的游标一律取「当前持有的最早一条」：本地翻页可能刚补进来更早的消息，
        // 用调用开始时的旧游标会把已经拿到的这段又重新拉一遍
        const serverCursor = () => {
          const current = get().messages[peerId] || [];
          return current.length > 0 ? current[0].timestamp ?? 0 : 0;
        };
        const serverSeqCursor = () => {
          const current = get().messages[peerId] || [];
          return current.length > 0 ? (current[0].seq ?? 0) : 0;
        };

        // 群聊：用最早消息的 seq 作游标拉更早一页（backward=true）
        if (type === 'group') {
          const oldestSeq = serverSeqCursor();
          if (oldestSeq === 0) {
            // 本地翻页已把 loadingHistory 置起：这里必须归位，否则再也触发不了加载
            set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: false } }));
            return;
          }
          set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: true } }));
          try {
            const res = await client.pullGroupMessages(peerId, oldestSeq, 50, true);
          // 服务端说没有更早的了：记住结论，下次翻到本地尽头就不必再问
          markServerExhausted(peerId, !res.hasMore);
            const historyMsgs: ChatMessage[] = (res.messages || []).map(m => toChatMessage(m, peerId));
            set((s) => {
              const existing = s.messages[peerId] || [];
              const existingIds = new Set(existing.map(m => m.id));
              // 本地副本缺签名 url 时用拉取结果补齐（服务端读侧已签名）
              const signedById = new Map(historyMsgs.map(m => [m.id, m.content]));
              const refreshed = existing.map(m => {
                if (!contentNeedsSignedUrl(m.msgType, m.content)) return m;
                const content = signedById.get(m.id);
                return content ? { ...m, content } : m;
              });
              // backward=true 返回 seq 降序，反转为正序后前置
              const newMsgs = historyMsgs.filter(m => !existingIds.has(m.id)).reverse();
              const merged = [...newMsgs, ...refreshed].sort((a, b) => a.timestamp - b.timestamp);
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
        const serverOldest = serverCursor();
        if (serverOldest === 0) {
          set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: false } }));
          return;
        }

        set((s) => ({ loadingHistory: { ...s.loadingHistory, [peerId]: true } }));
        try {
          const res = await client.pullHistory(peerId, serverOldest);
          markServerExhausted(peerId, !res.hasMore);
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
            // 本地副本缺签名 url 时用拉取结果补齐（服务端读侧已签名）
            const signedById = new Map(historyMsgs.map(m => [m.id, m.content]));
            const refreshed = existing.map(m => {
              if (!contentNeedsSignedUrl(m.msgType, m.content)) return m;
              const content = signedById.get(m.id);
              return content ? { ...m, content } : m;
            });
            const merged = [...newMsgs, ...refreshed].sort((a, b) => a.timestamp - b.timestamp);
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
              markServerExhausted(peerId, !res.hasMore);
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
          // 有缓存：从**本地最大 seq** 往后增量拉（重复的按 id 去重，缺口也能被覆盖）。
          // 不用已读水位：水位可能被其他端推到本地消息之前，用它当游标会永久跳过缺口。
          const { cursor, backward } = groupPullCursor(cached);
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
            markServerExhausted(peerId, !res.hasMore);
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

      /**
       * 登录/刷新后从 IndexedDB 恢复：每个会话最近一页，先本地后网络。
       * 恢复完再连网关，这样 openConversation 一进来就有内容、不需要为每个会话拉一页历史。
       * 幂等：多次调用共享同一个 Promise（重连/重复挂载不会重复读库）。
       */
      hydrateFromDb: () => {
        if (hydratePromise) return hydratePromise;
        hydratePromise = (async () => {
          const userId = useAuthStore.getState().user?.userId;
          if (!userId) return;
          const peerIds = Object.keys(useConversationStore.getState().conversations);
          if (peerIds.length === 0) return;
          localExhausted.clear();
          const { messages: restored, hasOlderLocal, serverExhausted: exhausted } =
            await hydrateChat(userId, peerIds);
          for (const [peerId, done] of Object.entries(exhausted)) {
            if (done) serverExhausted.add(peerId);
          }
          set((s) => {
            const messages = { ...s.messages };
            const hasMoreHistory = { ...s.hasMoreHistory };
            for (const [peerId, rows] of Object.entries(restored)) {
              if (rows.length === 0) continue;
              // 本地副本与内存副本（hydrate 期间推送进来的新消息）按 id 合并
              const existing = messages[peerId] || [];
              const existingIds = new Set(existing.map((m) => m.id));
              const older = rows.filter((m) => !existingIds.has(m.id));
              const merged = [...older, ...existing].sort((a, b) => a.timestamp - b.timestamp);
              // 登记为「已落库」，避免紧接着把这页原样回写一遍
              seedPersisted(peerId, rows);
              messages[peerId] = merged;
              // 还能上翻 = 本地库里还有更早的，或者服务端上次没说到头
              if (hasMoreHistory[peerId] === undefined) {
                hasMoreHistory[peerId] = !!hasOlderLocal[peerId] || !serverExhausted.has(peerId);
              }
            }
            const { messages: cleaned, changed } = sanitizePersistedMessages(messages, userId);
            return { messages: changed ? cleaned : messages, hasMoreHistory };
          });
        })();
        // 增量同步等这一步完成再算游标（游标依赖本地消息）
        markHydration(hydratePromise);
        return hydratePromise;
      },
    })
);

/**
 * 消息落库：订阅 store 变更，按会话增量写 IndexedDB（只写新增/改写的行）。
 * 放在订阅里而不是每个 action 里：写点集中、不会漏，且新增 action 自动生效。
 */
useChatStore.subscribe((state, prev) => {
  if (state.messages === prev.messages) return;
  persistMessagesDiff(prev.messages, state.messages);
});
