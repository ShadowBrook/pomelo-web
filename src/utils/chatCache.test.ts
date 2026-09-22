import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { ChatMessage } from '@/stores/useChatStore';

/**
 * 会话本地缓存回归：登录后从 IndexedDB 恢复历史、增量落库、老数据迁移、换账号清理。
 *
 * 这条链路是「刷新/重开不再重拉聊天记录」的关键——写坏了的表现是：
 * 要么本地永远读不回来（每次登录重新拉），要么把整段历史反复写盘（比 localStorage 还慢）。
 */

vi.mock('@/utils/idb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/idb')>();
  return { ...actual, messagesWrite: vi.fn(actual.messagesWrite) };
});

import * as idb from '@/utils/idb';
import {
  HYDRATE_PAGE,
  dropConversation,
  hydrateChat,
  loadHydratedMessages,
  loadOlderFromDb,
  markHydration,
  persistMessagesDiff,
  saveSnapshot,
  seedPersisted,
  whenHydrated,
  wipeChatCache,
} from './chatCache';

const writeMock = idb.messagesWrite as unknown as Mock;

function msg(overrides: Partial<ChatMessage> & { id: string; timestamp: number }): ChatMessage {
  return {
    senderId: 'peer-1',
    recipientId: 'me',
    msgType: 1,
    content: 'hi',
    status: 'seen',
    ...overrides,
  } as ChatMessage;
}

beforeEach(async () => {
  await wipeChatCache();
  await idb.kvDelete('cache:owner');
  writeMock.mockClear();
});

describe('消息落库 diff', () => {
  it('只写新增/改写的行，未变化的行不重写', async () => {
    const m1 = msg({ id: 'm1', timestamp: 100 });
    const m2 = msg({ id: 'm2', timestamp: 200 });
    const first = [m1, m2];
    persistMessagesDiff({}, { 'peer-1': first });
    // 首次落库：两行都写
    expect(writeMock.mock.calls[0][0]).toHaveLength(2);

    writeMock.mockClear();
    // 同一批对象引用（未变更）→ 一次写入都不发生
    persistMessagesDiff({ 'peer-1': first }, { 'peer-1': first.slice() });
    expect(writeMock).not.toHaveBeenCalled();

    // 追加一条 + 改写一条：只写这两行
    const m2edited = { ...m2, content: 'edited' };
    const m3 = msg({ id: 'm3', timestamp: 300 });
    persistMessagesDiff({ 'peer-1': first }, { 'peer-1': [m1, m2edited, m3] });
    const [upserts] = writeMock.mock.calls[0];
    expect(upserts.map((r: idb.StoredMessage) => r.id).sort()).toEqual(['m2', 'm3']);
    expect((writeMock.mock.calls[0][1] as string[][]).length).toBe(0);
  });

  it('上传中的占位气泡不落库（进度每秒十几次变更）', () => {
    const uploading = msg({ id: 'ph-1', timestamp: 100, uploadProgress: 37, status: 'sending', content: '' });
    persistMessagesDiff({}, { 'peer-1': [uploading] });
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('消息被删除时同步删库行', () => {
    const m1 = msg({ id: 'm1', timestamp: 100 });
    const m2 = msg({ id: 'm2', timestamp: 200 });
    persistMessagesDiff({}, { 'peer-1': [m1, m2] });
    writeMock.mockClear();
    persistMessagesDiff({ 'peer-1': [m1, m2] }, { 'peer-1': [m1] });
    const [upserts, deletes] = writeMock.mock.calls[0];
    expect(upserts).toHaveLength(0);
    expect(deletes).toEqual([['peer-1', 'm2']]);
  });

  it('内存里只有一页时，库里更早的行不会被误删', async () => {
    const all = Array.from({ length: 5 }, (_, i) => msg({ id: `m${i}`, timestamp: 100 + i }));
    persistMessagesDiff({}, { 'peer-1': all });
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-1', 99)).toHaveLength(5));

    // 模拟「新会话只载入了后 3 条」：上一状态为空，删除判定无从触发
    persistMessagesDiff({}, { 'peer-1': all.slice(2) });
    expect(await idb.messagesLatest('peer-1', 99)).toHaveLength(5);
  });

  it('会话整体消失时清空该会话的行', async () => {
    const m1 = msg({ id: 'm1', timestamp: 100 });
    persistMessagesDiff({}, { 'peer-1': [m1] });
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-1', 10)).toHaveLength(1));
    dropConversation('peer-1');
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-1', 10)).toHaveLength(0));
  });
});

describe('登录恢复', () => {
  it('读回每会话最近一页，发送中的消息降级为失败（重发队列已不在内存）', async () => {
    const rows = Array.from({ length: HYDRATE_PAGE + 10 }, (_, i) =>
      msg({ id: `m${i}`, timestamp: 1000 + i, status: i === HYDRATE_PAGE + 9 ? 'sending' : 'seen' }),
    );
    persistMessagesDiff({}, { 'peer-1': rows });
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-1', 1000)).toHaveLength(rows.length));

    const { messages } = await loadHydratedMessages(['peer-1']);
    const list = messages['peer-1'];
    expect(list).toHaveLength(HYDRATE_PAGE);
    // 最近的一页（时间升序），最新那条是发送中
    expect(list[0].timestamp).toBe(1010);
    expect(list[list.length - 1].status).toBe('failed');
  });

  it('本地往前翻页：返回更早的一页且不含游标当天之后的消息', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => msg({ id: `m${i}`, timestamp: 100 + i }));
    persistMessagesDiff({}, { 'peer-1': rows });
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-1', 99)).toHaveLength(5));

    const older = await loadOlderFromDb('peer-1', 103, 10);
    expect(older.map((m) => m.id)).toEqual(['m0', 'm1', 'm2']);
  });

  it('hydrateChat：换账号登录时清掉上一个账号的消息', async () => {
    persistMessagesDiff({}, { 'peer-1': [msg({ id: 'm1', timestamp: 100 })] });
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-1', 10)).toHaveLength(1));

    const first = await hydrateChat('user-a', ['peer-1']);
    expect(first.messages['peer-1']).toHaveLength(1);

    const second = await hydrateChat('user-b', ['peer-1']);
    expect(second.messages['peer-1']).toBeUndefined();
    expect(await idb.messagesLatest('peer-1', 10)).toHaveLength(0);
  });

  it('恢复后的消息登记为已落库，不会原样重写一遍', () => {
    const m1 = msg({ id: 'm1', timestamp: 100 });
    seedPersisted('peer-1', [m1]);
    persistMessagesDiff({}, { 'peer-1': [m1] });
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('带出「本地还有更早的 / 服务端已确认到底」两类信息，刷新后据此决定能否继续上翻', async () => {
    const rows = Array.from({ length: HYDRATE_PAGE + 5 }, (_, i) => msg({ id: `m${i}`, timestamp: 100 + i }));
    persistMessagesDiff({}, { 'peer-6': rows });
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-6', 999)).toHaveLength(rows.length));
    await saveSnapshot('serverExhausted', { 'peer-6': true, 'peer-7': true });

    const hydrated = await loadHydratedMessages(['peer-6']);
    // 库里 65 条、只恢复最近 60 条 → 本地还有更早的可以继续翻
    expect(hydrated.messages['peer-6']).toHaveLength(HYDRATE_PAGE);
    expect(hydrated.messages['peer-6'][0].id).toBe('m5');
    expect(hydrated.hasOlderLocal['peer-6']).toBe(true);
    // 服务端到底的结论也要带出来，供「翻到本地尽头后不再问服务端」使用
    expect(hydrated.serverExhausted).toEqual({ 'peer-6': true, 'peer-7': true });
  });
});

describe('老数据迁移', () => {
  const LEGACY = JSON.stringify({
    state: {
      messages: {
        'peer-9': [
          { id: 'old-1', senderId: 'peer-9', recipientId: 'me', msgType: 1, content: '老消息', status: 'seen', timestamp: 500 },
        ],
      },
    },
  });

  it('把 localStorage 里的旧消息搬进 IndexedDB 并删除旧键', async () => {
    const store = new Map<string, string>([['pomelo-chat', LEGACY]]);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });

    const { messages } = await hydrateChat('user-a', ['peer-9']);
    expect(messages['peer-9']?.[0]?.content).toBe('老消息');
    expect(store.has('pomelo-chat')).toBe(false);
    vi.unstubAllGlobals();
  });

  it('旧数据损坏时不阻塞登录', async () => {
    const store = new Map<string, string>([['pomelo-chat', '{ not json']]);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    const { messages } = await hydrateChat('user-a', ['peer-1']);
    expect(messages).toEqual({});
    vi.unstubAllGlobals();
  });
});

describe('恢复完成信号', () => {
  it('未登记时立即返回，登记后等它完成', async () => {
    let done = false;
    markHydration(
      new Promise<void>((resolve) => {
        setTimeout(() => {
          done = true;
          resolve();
        }, 5);
      }),
    );
    await whenHydrated();
    expect(done).toBe(true);
  });
});
