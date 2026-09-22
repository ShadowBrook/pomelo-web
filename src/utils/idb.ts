/**
 * IndexedDB 访问层：消息、媒体 blob、小型快照（群/好友/水位）。
 *
 * 与 localStorage 相比的三个好处（也是这个模块存在的理由）：
 *   1. 容量：localStorage 只有 ~5MB，媒体一多就写不进去；IDB 走配额（可到磁盘的几十百分比）。
 *   2. 异步：localStorage 是同步 API，每次写入都会阻塞主线程；消息多了会明显卡顿。
 *   3. 结构化：能直接存 Blob/对象，不必 JSON 序列化（媒体 blob 也只能靠 IDB 落地）。
 *
 * 无 IDB 环境（Node 单测、SSR、隐私模式禁用）统一降级为「无缓存」：
 * 读接口返回空、写接口静默丢弃，调用方按「本地没有」处理，退回服务端拉取路径。
 */

export type StoreName = 'messages' | 'media' | 'kv';

const DB_NAME = 'pomelo-web';
const DB_VERSION = 1;

/** 会话内单条消息（messages 表行，主键 [peerId, id]） */
export interface StoredMessage {
  peerId: string;
  id: string;
  senderId: string;
  recipientId: string;
  senderUserName?: string;
  senderNickname?: string;
  msgType: number;
  content: string;
  status: string;
  timestamp: number;
  seq?: number;
  clientMsgId?: string;
  mentions?: string[];
}

/** 媒体 blob 行（media 表，主键 key = 去掉预签名查询串的对象路径） */
export interface StoredMedia {
  key: string;
  blob: Blob;
  size: number;
  type: string;
  /** 最近一次命中的时间戳，LRU 淘汰按它升序 */
  at: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

/** Node 单测 / 隐私模式下没有 indexedDB：所有能力退化为「无缓存」 */
export function idbSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function toPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDb(): Promise<IDBDatabase | null> {
  if (!idbSupported()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let open: IDBOpenDBRequest;
    try {
      open = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: ['peerId', 'id'] });
        store.createIndex('byPeerTime', ['peerId', 'timestamp']);
      }
      if (!db.objectStoreNames.contains('media')) {
        const store = db.createObjectStore('media', { keyPath: 'key' });
        store.createIndex('byAt', 'at');
      }
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv', { keyPath: 'k' });
      }
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => resolve(null);
    open.onblocked = () => resolve(null);
  });
  return dbPromise;
}

/**
 * 在单个事务内执行若干请求。回调必须是「同步发起请求」的：
 * 在事务里 await 非 IDB 的 Promise 会让事务提前提交，后续请求抛 TransactionInactiveError。
 * 回调返回的 Promise 由各自的请求事件驱动，事务完成时统一取值。
 */
async function withStore<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise<T | undefined>((resolve) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(name, mode);
    } catch {
      resolve(undefined);
      return;
    }
    let result: T | undefined;
    let failed = false;
    tx.oncomplete = () => resolve(failed ? undefined : result);
    tx.onerror = () => resolve(undefined);
    tx.onabort = () => resolve(undefined);
    try {
      const value = fn(tx.objectStore(name));
      if (value && typeof (value as Promise<T>).then === 'function') {
        (value as Promise<T>).then(
          (v) => {
            result = v;
          },
          () => {
            failed = true;
          },
        );
      } else {
        result = value as T;
      }
    } catch {
      failed = true;
      try {
        tx.abort();
      } catch {
        // 事务可能已完成，忽略
      }
    }
  });
}

// ================================================================
// 消息
// ================================================================

/** (peerId, timestamp) 的范围键：空数组排在所有字符串之后，用来框住整个会话 */
function peerRange(peerId: string, from = 0, to = Number.MAX_SAFE_INTEGER): IDBKeyRange {
  return IDBKeyRange.bound([peerId, from], [peerId, to]);
}

function allOfPeer(peerId: string): IDBKeyRange {
  return IDBKeyRange.bound([peerId], [peerId, []], false, false);
}

/** 某会话最近 limit 条（按时间升序返回，直接可入 store） */
export async function messagesLatest(peerId: string, limit: number): Promise<StoredMessage[]> {
  const rows = await withStore<StoredMessage[]>('messages', 'readonly', (store) =>
    new Promise<StoredMessage[]>((resolve) => {
      const out: StoredMessage[] = [];
      const req = store.index('byPeerTime').openCursor(peerRange(peerId), 'prev');
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || out.length >= limit) {
          resolve(out.reverse());
          return;
        }
        out.push(cursor.value as StoredMessage);
        cursor.continue();
      };
      req.onerror = () => resolve(out.reverse());
    }),
  );
  return rows ?? [];
}

/** 早于 beforeTimestamp 的一页（按时间升序返回）；不足 limit 条说明本地到底了 */
export async function messagesBefore(
  peerId: string,
  beforeTimestamp: number,
  limit: number,
): Promise<StoredMessage[]> {
  const rows = await withStore<StoredMessage[]>('messages', 'readonly', (store) =>
    new Promise<StoredMessage[]>((resolve) => {
      const out: StoredMessage[] = [];
      const range = IDBKeyRange.bound([peerId, 0], [peerId, beforeTimestamp], false, true);
      const req = store.index('byPeerTime').openCursor(range, 'prev');
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || out.length >= limit) {
          resolve(out.reverse());
          return;
        }
        out.push(cursor.value as StoredMessage);
        cursor.continue();
      };
      req.onerror = () => resolve(out.reverse());
    }),
  );
  return rows ?? [];
}

/** 批量 upsert + 删除（单事务，避免逐条开事务的开销） */
export async function messagesWrite(upserts: StoredMessage[], deletes: string[][]): Promise<void> {
  if (upserts.length === 0 && deletes.length === 0) return;
  await withStore('messages', 'readwrite', (store) => {
    for (const row of upserts) store.put(row);
    for (const key of deletes) store.delete(key);
  });
}

export async function messagesDeleteConversation(peerId: string): Promise<void> {
  await withStore('messages', 'readwrite', (store) => {
    store.delete(allOfPeer(peerId));
  });
}

/** 该会话本地是否还有更早的消息（用于判断能否本地翻页） */
export async function messagesCount(peerId: string): Promise<number> {
  const n = await withStore<number>('messages', 'readonly', (store) =>
    toPromise(store.index('byPeerTime').count(peerRange(peerId))),
  );
  return n ?? 0;
}

// ================================================================
// KV（快照 / 水位等小对象）
// ================================================================

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const row = await withStore<{ k: string; v: T } | undefined>('kv', 'readonly', (store) =>
    toPromise(store.get(key) as IDBRequest<{ k: string; v: T } | undefined>),
  );
  return row?.v;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await withStore('kv', 'readwrite', (store) => {
    store.put({ k: key, v: value });
  });
}

export async function kvDelete(key: string): Promise<void> {
  await withStore('kv', 'readwrite', (store) => {
    store.delete(key);
  });
}

/** 按前缀删除（登出清理会话态时用，保留媒体缓存计数） */
export async function kvDeletePrefix(prefix: string): Promise<void> {
  await withStore('kv', 'readwrite', (store) => {
    const req = store.getAllKeys();
    req.onsuccess = () => {
      for (const key of req.result) {
        if (typeof key === 'string' && key.startsWith(prefix)) store.delete(key);
      }
    };
  });
}

// ================================================================
// 媒体 blob
// ================================================================

export async function mediaGet(key: string): Promise<StoredMedia | undefined> {
  return withStore<StoredMedia | undefined>('media', 'readonly', (store) =>
    toPromise(store.get(key) as IDBRequest<StoredMedia | undefined>),
  );
}

/** 只更新命中时间（LRU 用），避免为一次 touch 重写整个 blob */
export async function mediaTouch(key: string, at: number): Promise<void> {
  await withStore('media', 'readwrite', (store) => {
    const req = store.get(key) as IDBRequest<StoredMedia | undefined>;
    req.onsuccess = () => {
      const row = req.result;
      if (row) store.put({ ...row, at });
    };
  });
}

export async function mediaPut(row: StoredMedia): Promise<void> {
  await withStore('media', 'readwrite', (store) => {
    store.put(row);
  });
}

/**
 * 按 at 升序最多扫描 scanLimit 条，把超出 maxEntries 的部分删掉；
 * 同时按字节预算回收（先删最旧的，直到总量降到预算内）。
 */
export async function mediaTrim(
  maxEntries: number,
  maxBytes: number,
  scanLimit = 4000,
): Promise<void> {
  await withStore('media', 'readwrite', (store) => {
    const req = store.index('byAt').openCursor();
    let seen = 0;
    const rows: StoredMedia[] = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || seen >= scanLimit) {
        // 条目超限：从最旧的开始删
        let total = rows.reduce((sum, r) => sum + (r.size || 0), 0);
        let count = rows.length;
        for (const row of rows) {
          if (count <= maxEntries && total <= maxBytes) break;
          store.delete(row.key);
          count -= 1;
          total -= row.size || 0;
        }
        return;
      }
      seen += 1;
      rows.push(cursor.value as StoredMedia);
      cursor.continue();
    };
  });
}

export async function wipeMessages(): Promise<void> {
  await withStore('messages', 'readwrite', (store) => {
    store.clear();
  });
}
