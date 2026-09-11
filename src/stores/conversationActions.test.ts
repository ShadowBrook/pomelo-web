import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from './useConversationStore';
import { useWindowStore } from './useWindowStore';
import { openConversation, openMostRecentConversation } from './conversationActions';

function seedConversation(peerId: string, lastMessageTime: number) {
  useConversationStore.setState((s) => ({
    conversations: {
      ...s.conversations,
      [peerId]: {
        peerId,
        type: 'c2c',
        nickname: peerId,
        avatar: '',
        lastMessage: 'hi',
        lastMessageTime,
        unreadCount: 0,
      },
    },
  }));
}

/**
 * 聊天窗目标（windowStore.chatPeerId）与列表选中态（conversationStore.activePeerId）
 * 是两个独立字段，必须一起切——登录进入页面时曾只切前者，
 * 表现为"右侧显示了默认会话、左侧那一行没有高亮"。
 */
describe('openConversation', () => {
  beforeEach(() => {
    useConversationStore.getState().clearAll();
    useWindowStore.getState().clearAll();
  });

  it('同时切换聊天窗与列表选中态', () => {
    openConversation('peer-1');

    expect(useWindowStore.getState().chatPeerId).toBe('peer-1');
    expect(useConversationStore.getState().activePeerId).toBe('peer-1');
  });
});

describe('openMostRecentConversation', () => {
  beforeEach(() => {
    useConversationStore.getState().clearAll();
    useWindowStore.getState().clearAll();
  });

  it('默认打开最近一个会话并高亮（登录/刷新后的入口）', () => {
    seedConversation('older', 1000);
    seedConversation('newer', 2000);

    openMostRecentConversation();

    expect(useWindowStore.getState().chatPeerId).toBe('newer');
    expect(useConversationStore.getState().activePeerId).toBe('newer');
    expect(useWindowStore.getState().imVisible).toBe(true);
  });

  it('选中态与聊天窗必须指向同一个会话', () => {
    seedConversation('a', 1000);
    openMostRecentConversation();

    const { chatPeerId } = useWindowStore.getState();
    expect(chatPeerId).not.toBeNull();
    expect(useConversationStore.getState().activePeerId).toBe(chatPeerId);
  });

  it('无会话时只显示 IM 界面，不开聊天窗', () => {
    openMostRecentConversation();

    expect(useWindowStore.getState().imVisible).toBe(true);
    expect(useWindowStore.getState().chatPeerId).toBeNull();
    expect(useConversationStore.getState().activePeerId).toBeNull();
  });
});
