import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * 本地缓存接入 store 后的行为回归：
 *   - 恢复：登录时从 IndexedDB 取回历史，且不把刚读出来的这页原样回写
 *   - 翻页：本地能翻到的历史不打服务端（这正是「减少服务端压力」的落点）
 *   - 游标：群增量从本地最大 seq 往后拉；账号水位只算收到的 c2c 消息
 *   - 落库：store 变更自动增量写库；登出整库清空
 */

const { fakeClient } = vi.hoisted(() => ({
  fakeClient: {
    pullHistory: vi.fn(),
    pullGroupMessages: vi.fn(),
  },
}));

vi.mock('@/hooks/useIMClient', () => ({ getIMClient: () => fakeClient }));

import * as idb from '@/utils/idb';
import { useChatStore, groupPullCursor, localInboxWatermark } from './useChatStore';
import { useConversationStore } from './useConversationStore';
import { useAuthStore } from './useAuthStore';

const writeSpy = vi.spyOn(idb, 'messagesWrite');

function row(peerId: string, id: string, timestamp: number, overrides: Partial<idb.StoredMessage> = {}): idb.StoredMessage {
  return {
    peerId,
    id,
    senderId: 'peer-1',
    recipientId: 'me',
    msgType: 1,
    content: 'hi',
    status: 'seen',
    timestamp,
    ...overrides,
  };
}

beforeEach(async () => {
  await idb.wipeMessages();
  await idb.kvDelete('cache:owner');
  await idb.kvDeletePrefix('snap:');
  useChatStore.setState({ messages: {}, hasMoreHistory: {}, loadingHistory: {}, groupReadStates: {} });
  useConversationStore.setState({ conversations: {}, activePeerId: null });
  vi.clearAllMocks();
});

describe('增量游标', () => {
  it('群聊：本地最大 seq 作游标；本地为空时拉最近一页', () => {
    const msgs = [
      { id: 'a', senderId: 'u1', recipientId: 'g', msgType: 1, content: '', status: 'seen', timestamp: 1, seq: 7 },
      { id: 'b', senderId: 'u1', recipientId: 'g', msgType: 1, content: '', status: 'seen', timestamp: 2, seq: 12 },
    ] as never;
    expect(groupPullCursor(msgs)).toEqual({ cursor: 12, backward: false });
    expect(groupPullCursor([])).toEqual({ cursor: 0, backward: true });
  });

  it('账号水位只算收到的单聊消息：排除自己发的与群消息', () => {
    useConversationStore.setState({
      conversations: {
        'peer-1': { peerId: 'peer-1', type: 'c2c', nickname: 'p1', avatar: '', lastMessage: '', lastMessageTime: 0, unreadCount: 0 },
        g1: { peerId: 'g1', type: 'group', nickname: 'g1', avatar: '', lastMessage: '', lastMessageTime: 0, unreadCount: 0 },
      },
    });
    useChatStore.setState({
      messages: {
        'peer-1': [
          { id: 'r1', senderId: 'peer-1', recipientId: 'me', msgType: 1, content: '', status: 'seen', timestamp: 1, seq: 5 },
          { id: 'own', senderId: 'me', recipientId: 'peer-1', msgType: 1, content: '', status: 'seen', timestamp: 2, seq: 99 },
        ],
        g1: [
          { id: 'gm', senderId: 'peer-2', recipientId: 'g1', msgType: 1, content: '', status: 'seen', timestamp: 3, seq: 1000 },
        ],
      } as never,
    });
    expect(localInboxWatermark('me')).toBe(5);
  });
});

describe('恢复与落库', () => {
  it('登录恢复：读回本地历史、标记可继续上翻，且不重复写库', async () => {
    await idb.messagesWrite([row('peer-1', 'm1', 1000), row('peer-1', 'm2', 2000)], []);
    useAuthStore.setState({
      user: { userId: 'me', userName: 'me', nickname: 'me', avatar: '', signature: '' },
      token: 't',
      isLoggedIn: true,
    });
    useConversationStore.setState({
      conversations: {
        'peer-1': { peerId: 'peer-1', type: 'c2c', nickname: 'p1', avatar: '', lastMessage: '', lastMessageTime: 2000, unreadCount: 0 },
      },
    });

    writeSpy.mockClear();
    await useChatStore.getState().hydrateFromDb();

    const state = useChatStore.getState();
    expect(state.messages['peer-1']?.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(state.hasMoreHistory['peer-1']).toBe(true);
    // 刚读出来的这页不再写回去（否则每次刷新都把整页重写一遍）
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('store 变更自动增量落库', async () => {
    useChatStore.setState((s) => ({
      messages: {
        ...s.messages,
        'peer-7': [
          { id: 'live-1', senderId: 'peer-7', recipientId: 'me', msgType: 1, content: 'live', status: 'delivered', timestamp: 1234 },
        ],
      },
    }));
    await vi.waitFor(async () => {
      const rows = await idb.messagesLatest('peer-7', 10);
      expect(rows.map((r) => r.id)).toEqual(['live-1']);
    });
  });

  it('登出清空本地库', async () => {
    await idb.messagesWrite([row('peer-5', 'x1', 10)], []);
    useChatStore.getState().clearAll();
    await vi.waitFor(async () => expect(await idb.messagesLatest('peer-5', 10)).toHaveLength(0));
  });
});

describe('历史翻页：先本地、后服务端', () => {
  it('本地满一页时完全不打扰服务端', async () => {
    const older = Array.from({ length: 60 }, (_, i) => row('peer-8', `old-${i}`, 100 + i));
    await idb.messagesWrite(older, []);
    useChatStore.setState({
      messages: {
        'peer-8': [
          { id: 'new-1', senderId: 'peer-8', recipientId: 'me', msgType: 1, content: 'new', status: 'seen', timestamp: 900 },
        ],
      },
      hasMoreHistory: {},
      loadingHistory: {},
    });

    await useChatStore.getState().loadMoreHistory('peer-8', 'c2c');
    expect(fakeClient.pullHistory).not.toHaveBeenCalled();
    const ids = useChatStore.getState().messages['peer-8'].map((m) => m.id);
    // 本地补进来一页（50 条）：最旧的 10 条留待下一次继续本地翻
    expect(ids).toHaveLength(51);
    expect(ids[0]).toBe('old-10');
    expect(useChatStore.getState().loadingHistory['peer-8']).toBe(false);
  });

  it('本地不足一页时同一次动作里回落服务端，且游标前移到最新的最旧一条', async () => {
    await idb.messagesWrite([row('peer-9', 'old-1', 100), row('peer-9', 'old-2', 200)], []);
    useChatStore.setState({
      messages: {
        'peer-9': [
          { id: 'new-1', senderId: 'peer-9', recipientId: 'me', msgType: 1, content: 'new', status: 'seen', timestamp: 500 },
        ],
      },
      hasMoreHistory: {},
      loadingHistory: {},
    });
    fakeClient.pullHistory.mockResolvedValue({
      messages: [
        { id: 'srv-1', senderId: 'peer-9', recipientId: 'me', msgType: 1, content: 'older', createdAt: 50, seq: 1 } as never,
      ],
      hasMore: true,
      code: 0,
      message: '',
    });

    await useChatStore.getState().loadMoreHistory('peer-9', 'c2c');
    expect(fakeClient.pullHistory).toHaveBeenCalledTimes(1);
    // 游标 = 本地补完之后的当前最旧一条（100），而不是调用开始时的 500
    expect(fakeClient.pullHistory.mock.calls[0][1]).toBe(100);
    expect(useChatStore.getState().messages['peer-9'].map((m) => m.id)).toEqual([
      'srv-1', 'old-1', 'old-2', 'new-1',
    ]);

    // 本地已翻到底：下次直接走服务端
    fakeClient.pullHistory.mockClear();
    await useChatStore.getState().loadMoreHistory('peer-9', 'c2c');
    expect(fakeClient.pullHistory).toHaveBeenCalledTimes(1);

    // 服务端说没有了（hasMore=false）：再滚也不再发请求
    fakeClient.pullHistory.mockClear();
    fakeClient.pullHistory.mockResolvedValue({ messages: [], hasMore: false, code: 0, message: '' });
    await useChatStore.getState().loadMoreHistory('peer-9', 'c2c');
    expect(fakeClient.pullHistory).toHaveBeenCalledTimes(1);
    fakeClient.pullHistory.mockClear();
    await useChatStore.getState().loadMoreHistory('peer-9', 'c2c');
    expect(fakeClient.pullHistory).not.toHaveBeenCalled();
  });
});
