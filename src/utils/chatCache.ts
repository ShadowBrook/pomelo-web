/**
 * 会话本地缓存（IndexedDB 落地层）。
 *
 * 与安卓 Room 的对应关系：
 *   messageDao.latestByConversation → hydrateChat（登录时恢复每会话最近一页）
 *   messageDao.upsert               → 变更订阅 diff 后的增量写（只写变化的行）
 *   messageDao 时间游标翻页          → loadOlderFromDb（本地先翻，翻不动才打服务端）
 *
 * 为什么不直接给 zustand persist 换个 IDB storage：
 * persist 每次变更都序列化整个 messages 对象（几 MB、每条消息一次），
 * 这里改成「订阅 + 按会话 diff」，一次消息只写一行。
 */

import type { ChatMessage } from '@/stores/useChatStore';
import {
  kvDelete,
  kvDeletePrefix,
  kvGet,
  kvSet,
  messagesBefore,
  messagesCount,
  messagesDeleteConversation,
  messagesLatest,
  messagesWrite,
  wipeMessages,
  type StoredMessage,
} from '@/utils/idb';

/** 登录时每个会话恢复的最近条数（对齐安卓的 50，略放宽到 60 便于向上滚动） */
export const HYDRATE_PAGE = 60;

/** 本地翻页一页的条数 */
export const LOCAL_PAGE = 50;

/** 缓存归属人：换账号登录时清掉上一个账号的消息，避免串号 */
const OWNER_KEY = 'cache:owner';

/** 旧版本消息缓存（zustand persist 写 localStorage），首次运行迁进 IDB */
const LEGACY_KEY = 'pomelo-chat';

/** 已落库消息的对象引用快照：靠引用比较找出「新增/被改写」的行，避免深比较 */
const persisted = new Map<string, Map<string, ChatMessage>>();

function toStored(peerId: string, msg: ChatMessage): StoredMessage {
  // localUrl 是内存 object URL、uploadProgress 是瞬时进度：都不落库
  return {
    peerId,
    id: msg.id,
    senderId: msg.senderId,
    recipientId: msg.recipientId,
    senderUserName: msg.senderUserName,
    senderNickname: msg.senderNickname,
    msgType: msg.msgType as number,
    content: msg.content,
    status: msg.status,
    timestamp: msg.timestamp,
    seq: msg.seq,
    clientMsgId: msg.clientMsgId,
    mentions: msg.mentions,
  };
}

function toChat(row: StoredMessage): ChatMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    recipientId: row.recipientId,
    senderUserName: row.senderUserName,
    senderNickname: row.senderNickname,
    msgType: row.msgType as ChatMessage['msgType'],
    content: row.content,
    // 刷新后重发队列已不在内存：把「发送中」降级为「失败」，让用户能手动重试
    status: row.status === 'sending' ? 'failed' : (row.status as ChatMessage['status']),
    timestamp: row.timestamp,
    seq: row.seq,
    clientMsgId: row.clientMsgId,
    mentions: row.mentions,
  };
}

/** 把 store 里已有的对象登记为「已落库」，避免 hydrate 后原样回写一遍 */
export function seedPersisted(peerId: string, messages: ChatMessage[]): void {
  const snapshot = persisted.get(peerId) ?? new Map<string, ChatMessage>();
  for (const msg of messages) snapshot.set(msg.id, msg);
  persisted.set(peerId, snapshot);
}

/** 登出/清库后丢弃快照，防止后续 diff 把旧行又写回去 */
export function resetPersisted(): void {
  persisted.clear();
}

/**
 * 按会话增量落库：
 *   - 对象引用没变的行跳过（store 只在新增/改写时创建新对象）
 *   - 上传中的占位气泡跳过（进度每秒十几次变更，落库毫无意义；完成时对象已换，自然写入）
 *   - 删除只针对「上一状态里有、这一状态没了」的行（本地改 id、撤回、清空会话）
 *
 * 删除为什么不能按「快照里有、当前数组里没有」判定：库里可能存着比内存更早的历史
 * （内存只载入一页），那些行只是没被读进内存，不该被当成删掉了。
 */
export function persistMessagesDiff(
  prev: Record<string, ChatMessage[]>,
  next: Record<string, ChatMessage[]>,
): void {
  for (const [peerId, list] of Object.entries(next)) {
    if (prev[peerId] === list) continue;
    const snapshot = persisted.get(peerId) ?? new Map<string, ChatMessage>();
    const alive = new Set(list.map((m) => m.id));
    const upserts: StoredMessage[] = [];
    for (const msg of list) {
      if (snapshot.get(msg.id) === msg) continue;
      if (msg.uploadProgress != null) continue;
      upserts.push(toStored(peerId, msg));
      snapshot.set(msg.id, msg);
    }
    const deletes: string[][] = [];
    for (const gone of prev[peerId] ?? []) {
      if (alive.has(gone.id)) continue;
      deletes.push([peerId, gone.id]);
      snapshot.delete(gone.id);
    }
    persisted.set(peerId, snapshot);
    if (upserts.length > 0 || deletes.length > 0) {
      void messagesWrite(upserts, deletes);
    }
  }
  for (const peerId of Object.keys(prev)) {
    if (next[peerId] === undefined && persisted.has(peerId)) {
      dropConversation(peerId);
    }
  }
}

/** 单会话清空 */
export function dropConversation(peerId: string): void {
  persisted.delete(peerId);
  void messagesDeleteConversation(peerId);
}

/** 小型快照（群列表 / 好友列表 / 已读水位）：整块 JSON 存取 */
export async function loadSnapshot<T>(key: string): Promise<T | undefined> {
  return kvGet<T>(`snap:${key}`);
}

export async function saveSnapshot(key: string, value: unknown): Promise<void> {
  await kvSet(`snap:${key}`, value);
}

export async function dropSnapshot(key: string): Promise<void> {
  await kvDelete(`snap:${key}`);
}

export interface HydratedChat {
  messages: Record<string, ChatMessage[]>;
  /** 本地库里还有比恢复出来的这一页更早的消息（可以继续本地上翻） */
  hasOlderLocal: Record<string, boolean>;
  /** 上次会话已问过服务端并确认「没有更早的历史」——刷新后不必再问一次 */
  serverExhausted: Record<string, boolean>;
}

/** 是否有可用的本地缓存（无 IDB 环境恒为 false） */
export async function loadHydratedMessages(peerIds: string[]): Promise<HydratedChat> {
  const messages: Record<string, ChatMessage[]> = {};
  const hasOlderLocal: Record<string, boolean> = {};
  for (const peerId of peerIds) {
    const rows = await messagesLatest(peerId, HYDRATE_PAGE);
    if (rows.length === 0) continue;
    messages[peerId] = rows.map(toChat);
    // 精确判断「本地还有更早的」：库里总行数 > 这一页，才有本地上一页可翻
    hasOlderLocal[peerId] = (await messagesCount(peerId)) > rows.length;
  }
  const serverExhausted = (await loadSnapshot<Record<string, boolean>>('serverExhausted')) ?? {};
  return { messages, hasOlderLocal, serverExhausted };
}

/** 本地往前翻一页（比 beforeTimestamp 更早） */
export async function loadOlderFromDb(
  peerId: string,
  beforeTimestamp: number,
  limit = LOCAL_PAGE,
): Promise<ChatMessage[]> {
  const rows = await messagesBefore(peerId, beforeTimestamp, limit);
  return rows.map(toChat);
}

async function claimOwner(userId: string): Promise<void> {
  const owner = await kvGet<string>(OWNER_KEY);
  if (owner && owner !== userId) {
    // 换账号：上一个账号的消息留在本地属于串号泄漏，整段清掉
    await wipeMessages();
    await kvDeletePrefix('snap:');
    resetPersisted();
  }
  await kvSet(OWNER_KEY, userId);
}

/**
 * 老版本遗留消息迁入 IDB（zustand persist 写下的 localStorage 全量快照）。
 * 迁完即删键，之后 localStorage 不再承担消息存储。
 */
async function migrateLegacy(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as { state?: { messages?: Record<string, ChatMessage[]> } };
    const messages = parsed.state?.messages;
    if (messages) {
      for (const [peerId, list] of Object.entries(messages)) {
        const rows = (list || []).map((m) => toStored(peerId, m));
        await messagesWrite(rows, []);
      }
    }
  } catch {
    // 遗留数据结构不可解析：直接丢弃，聊天记录以服务端为准
  } finally {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // 隐私模式下 removeItem 也可能抛，忽略
    }
  }
}

/**
 * 登录/刷新后的恢复流程：认领归属 → 迁移老数据 → 读回每会话最近一页。
 * 返回的消息由调用方写进 store，并需对每个会话调用 seedPersisted。
 */
export async function hydrateChat(userId: string, peerIds: string[]): Promise<HydratedChat> {
  await claimOwner(userId);
  await migrateLegacy();
  return loadHydratedMessages(peerIds);
}

/** 登出清库（媒体缓存保留：按对象路径寻址，不含会话内容） */
export async function wipeChatCache(): Promise<void> {
  resetPersisted();
  await wipeMessages();
  await kvDeletePrefix('snap:');
}

// ================================================================
// 恢复完成信号
// ================================================================

let hydration: Promise<void> = Promise.resolve();

/** 由 store 在启动恢复时登记，让「上线后的增量同步」等本地数据就位再算游标 */
export function markHydration(promise: Promise<void>): void {
  hydration = promise.catch(() => undefined);
}

/** 等本地恢复完成（未登记时立即返回） */
export function whenHydrated(): Promise<void> {
  return hydration;
}
