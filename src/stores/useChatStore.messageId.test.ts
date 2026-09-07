import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, sanitizePersistedMessages } from './useChatStore';
import { MsgType } from '@/sdk/types';

describe('useChatStore 消息 ID 与服务端对齐', () => {
  beforeEach(() => useChatStore.getState().clearAll());

  it('onStatusChange 收到 serverMessageId 后，本地 id 应对齐为服务端 id（历史拉取去重依赖此对齐）', () => {
    useChatStore.getState().sendText('peer-1', '???', () => 'client-msg-id');

    useChatStore.getState().onStatusChange({
      id: 'client-msg-id',
      status: 'sent',
      seq: 10019,
      serverMessageId: '355239648642994176',
    });

    const msgs = useChatStore.getState().messages['peer-1'];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe('355239648642994176');
    expect(msgs[0].clientMsgId).toBe('client-msg-id');
  });

  it('对齐后，后续以 client id 派发的状态事件（delivered/seen）仍能命中同一条消息', () => {
    useChatStore.getState().sendText('peer-1', '???', () => 'client-msg-id');
    useChatStore.getState().onStatusChange({
      id: 'client-msg-id',
      status: 'sent',
      seq: 1,
      serverMessageId: '355239648642994176',
    });
    useChatStore.getState().onStatusChange({ id: 'client-msg-id', status: 'seen', seq: 1 });

    const msgs = useChatStore.getState().messages['peer-1'];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].status).toBe('seen');
    expect(msgs[0].id).toBe('355239648642994176');
  });

  it('对齐后模拟刷新：历史拉取返回服务端 id 的同内容消息，按 id 去重后不产生重复', () => {
    useChatStore.getState().sendText('peer-1', '???', () => 'client-msg-id');
    useChatStore.getState().onStatusChange({
      id: 'client-msg-id',
      status: 'sent',
      seq: 10019,
      serverMessageId: '355239648642994176',
    });

    // 直接模拟 loadMoreHistory 的合并逻辑（服务端返回 id=355239... 的同一消息）
    const state = useChatStore.getState();
    const existing = state.messages['peer-1'] || [];
    const existingIds = new Set(existing.map((m) => m.id));
    const pulled = {
      id: '355239648642994176',
      senderId: '__self__',
      recipientId: 'peer-1',
      msgType: MsgType.TEXT as const,
      content: '???',
      status: 'seen' as const,
      timestamp: existing[0].timestamp,
      seq: 10019,
    };
    const added = [pulled].filter((m) => !existingIds.has(m.id));
    expect(added).toHaveLength(0);
  });

  it('sanitizePersistedMessages：旧版遗留的同 seq 同方向重复消息（客户端 id + 服务端 id）只保留一条，另一方向撞号不误删', () => {
    // 模拟旧版本持久化：自己发的 ??? 在刷新后存了两份（客户端 id 副本 + 服务端 id 副本）
    const { messages: cleaned, changed } = sanitizePersistedMessages(
      {
        'peer-1': [
          { id: 'client-msg-id', senderId: '__self__', recipientId: 'peer-1', msgType: MsgType.TEXT, content: '???', status: 'seen', timestamp: 1000, seq: 10019 },
          // 服务端副本：senderId 是自己的真实 ID，seq 相同、id 不同 → 应判重
          { id: '355239648642994176', senderId: '353116594605391872', recipientId: 'peer-1', msgType: MsgType.TEXT, content: '???', status: 'seen', timestamp: 1000, seq: 10019 },
          // C2C 另一方向的 seq 用对方计数器，撞号也不得误删
          { id: '777', senderId: '353117229866287104', recipientId: 'peer-1', msgType: MsgType.TEXT, content: '不同消息', status: 'seen', timestamp: 2000, seq: 5 },
          // 无 seq 的本地发送中消息不受影响
          { id: '888', senderId: '__self__', recipientId: 'peer-1', msgType: MsgType.TEXT, content: '???', status: 'sending', timestamp: 3000 },
        ],
      },
      '353116594605391872',
    );

    expect(changed).toBe(true);
    expect(cleaned['peer-1'].filter((m) => m.seq === 10019)).toHaveLength(1);
    expect(cleaned['peer-1'].some((m) => m.id === '777')).toBe(true);
    expect(cleaned['peer-1'].some((m) => m.id === '888')).toBe(true);
  });
});
