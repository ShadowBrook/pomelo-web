import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from './useConversationStore';

/**
 * 群名回填回归：改名可能发生在别的端 / 本机离线期间，那时本机只有推送或什么都没有。
 * 登录后拉回的群列表才是权威来源——如果不回填到会话昵称，会话列表会一直显示旧群名
 * （列表项、聊天窗标题读的都是 conversation.nickname）。
 */
describe('applyGroupNames', () => {
  beforeEach(() => {
    useConversationStore.setState({
      conversations: {
        'g1': {
          peerId: 'g1', type: 'group', nickname: '旧群名', avatar: '',
          lastMessage: 'hi', lastMessageTime: 1, unreadCount: 0,
        },
        'g2': {
          peerId: 'g2', type: 'group', nickname: 'g2', avatar: '',
          lastMessage: '', lastMessageTime: 0, unreadCount: 0,
        },
        'peer-1': {
          peerId: 'peer-1', type: 'c2c', nickname: '好友昵称', avatar: '',
          lastMessage: '', lastMessageTime: 0, unreadCount: 0,
        },
      },
      activePeerId: null,
    });
  });

  it('群会话昵称按服务端群名刷新（离线期间被改名的场景）', () => {
    useConversationStore.getState().applyGroupNames([{ groupId: 'g1', name: '新群名' }]);
    expect(useConversationStore.getState().conversations['g1'].nickname).toBe('新群名');
  });

  it('历史遗留「昵称=groupId」的群会话也被纠正', () => {
    useConversationStore.getState().applyGroupNames([{ groupId: 'g2', name: '某群' }]);
    expect(useConversationStore.getState().conversations['g2'].nickname).toBe('某群');
  });

  it('单聊会话与空群名不受影响', () => {
    useConversationStore.getState().applyGroupNames([
      { groupId: 'peer-1', name: '不该覆盖' },
      { groupId: 'g1', name: '  ' },
    ]);
    const convs = useConversationStore.getState().conversations;
    expect(convs['peer-1'].nickname).toBe('好友昵称');
    expect(convs['g1'].nickname).toBe('旧群名');
  });

  it('名称未变化时不产生新的 conversations 引用（避免无谓重渲染）', () => {
    const before = useConversationStore.getState().conversations;
    useConversationStore.getState().applyGroupNames([{ groupId: 'g1', name: '旧群名' }]);
    expect(useConversationStore.getState().conversations).toBe(before);
  });

  it('群列表里没有的会话保持原样（未加入的旧会话不动）', () => {
    useConversationStore.getState().applyGroupNames([{ groupId: 'other', name: '别群' }]);
    expect(useConversationStore.getState().conversations['g1'].nickname).toBe('旧群名');
  });
});
