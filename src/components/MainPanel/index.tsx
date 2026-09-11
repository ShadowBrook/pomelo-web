import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConversationStore } from '@/stores/useConversationStore';
import { openConversation } from '@/stores/conversationActions';
import { useChatStore } from '@/stores/useChatStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useWindowStore } from '@/stores/useWindowStore';
import { useConnStore } from '@/stores/useConnStore';
import { ConversationItem } from '@/components/ConversationItem';
import { FriendsPanel } from '@/components/FriendsPanel';
import { GroupPanel } from '@/components/GroupPanel';
import { AddFriendDialog } from '@/components/AddFriendDialog';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';
import { useGroupStore } from '@/stores/useGroupStore';

type Tab = 'chats' | 'friends' | 'groups';

function IconChat({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.1.9 4 2.3 5.5-.2 1.2-.8 2.6-1.6 3.5-.2.2 0 .6.3.6 1.9-.2 3.6-1 4.7-1.8 1.3.5 2.8.8 4.3.8 5.5 0 10-3.9 10-8.6S17.5 3 12 3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconFriend({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5" />
      <path d="M16.5 4.5a3.5 3.5 0 0 1 0 7M18 15.2c1.9.6 3.2 2 3.7 4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconGroup({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
      <circle cx="8.5" cy="8.5" r="3" />
      <circle cx="16" cy="9.5" r="2.5" />
      <path d="M3 19c.7-2.7 3-4.5 5.5-4.5s4.8 1.8 5.5 4.5M14.5 14.8c2-.3 4 .9 4.8 3.2" />
    </svg>
  );
}

export function MainPanel() {
  const connState = useConnStore((s) => s.state);
  const activePeerId = useConversationStore((s) => s.activePeerId);
  const { totalUnread } = useUnreadCount();
  const pendingRequests = useFriendStore((s) => s.pendingRequests);
  const pendingCount = useFriendStore((s) => s.pendingRequests.length);
  const friendCount = useFriendStore((s) => s.friends.length);
  const groupCount = useGroupStore((s) => Object.keys(s.groups).length);

  const sortedPeerIds = useConversationStore(
    useShallow((s) =>
      Object.keys(s.conversations).sort(
        (a, b) => (s.conversations[b].lastMessageTime || 0) - (s.conversations[a].lastMessageTime || 0),
      ),
    ),
  );

  const [tab, setTab] = useState<Tab>('chats');
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleSelectConversation = useCallback((peerId: string) => {
    openConversation(peerId);
  }, []);

  const handleDeleteConversation = useCallback((peerId: string) => {
    useConversationStore.getState().removeConversation(peerId);
    useChatStore.getState().clearMessages(peerId);
    const ws = useWindowStore.getState();
    if (ws.chatPeerId === peerId) {
      const next = useConversationStore.getState().getSortedList()[0];
      // 切换目标会话必须走 openConversation：removeConversation 已把 activePeerId 置空，
      // 只调 openChat 会让新会话在列表里没有高亮
      if (next) openConversation(next);
      else ws.closeChat();
    }
  }, []);

  const handleChatWithFriend = useCallback(
    (peerId: string, nickname: string, avatar: string) => {
      useConversationStore.getState().createConversation(peerId, nickname, avatar, 'c2c');
      openConversation(peerId);
      setTab('chats');
    },
    [],
  );

  const handleSelectGroup = useCallback(
    (groupId: string, name: string) => {
      useConversationStore.getState().createConversation(groupId, name, '', 'group');
      openConversation(groupId);
      setTab('chats');
    },
    [],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-sidebar">
      {/* 图标 tab 行：聊天 / 好友 / 群聊 */}
      <div className="flex border-b border-line flex-shrink-0">
        {([
          { key: 'chats', icon: IconChat, title: '消息', badge: 0 },
          { key: 'friends', icon: IconFriend, title: '好友', badge: pendingCount },
          { key: 'groups', icon: IconGroup, title: '群聊', badge: 0 },
        ] as const).map(({ key, icon: Icon, title, badge }) => (
          <button
            key={key}
            title={title}
            onClick={() => setTab(key)}
            className={`relative flex-1 h-10 flex items-center justify-center transition-colors border-r border-line last:border-r-0 ${
              tab === key ? 'bg-selected text-accent' : 'text-text-sub hover:text-text-main'
            }`}
          >
            <Icon active={tab === key} />
            {badge > 0 && (
              <span className="absolute top-1 left-1/2 translate-x-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-danger text-white text-[10px] leading-[15px] text-center">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 统计行（每 tab 各自，参考截图） */}
      {tab === 'chats' && (
        <div className="flex items-center justify-between pl-3 pr-2 py-1.5 border-b border-line flex-shrink-0">
          <span className="text-xs text-text-sub">
            交谈 {sortedPeerIds.length} / <span className="text-danger">未读 {totalUnread}</span>
          </span>
          <div className="relative">
            <button
              onClick={() => setPlusMenuOpen((v) => !v)}
              className="w-5 h-5 flex items-center justify-center rounded-sm bg-accent text-white text-sm leading-none hover:opacity-85"
              title="添加"
            >
              +
            </button>
            {plusMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-50 w-28 bg-panel rounded-md shadow-xl border border-line py-1">
                  <button onClick={() => { setPlusMenuOpen(false); setShowAddFriend(true); }} className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-bg-page">
                    添加好友
                  </button>
                  <button onClick={() => { setPlusMenuOpen(false); setShowCreateGroup(true); }} className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-bg-page">
                    创建群聊
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {tab === 'friends' && (
        <div className="flex items-center justify-between pl-3 pr-2 py-1.5 border-b border-line flex-shrink-0">
          <span className="text-xs text-text-sub">
            总好友 <span className="text-accent">{friendCount}</span>
          </span>
          <button onClick={() => setShowAddFriend(true)} className="w-5 h-5 flex items-center justify-center rounded-sm text-accent hover:bg-selected" title="添加好友">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5M18 8v6M15 11h6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      {tab === 'groups' && (
        <div className="flex items-center justify-between pl-3 pr-2 py-1.5 border-b border-line flex-shrink-0">
          <span className="text-xs text-text-sub">
            群聊数 <span className="text-accent">{groupCount}</span>
          </span>
          <button onClick={() => setShowCreateGroup(true)} className="w-5 h-5 flex items-center justify-center rounded-sm text-accent hover:bg-selected" title="创建群聊">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5M18 8v6M15 11h6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* 列表区 */}
      {tab === 'chats' && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* 确认提醒置顶特殊项（参考 rb_main1：绿铃铛 + 未读徽章，点击切好友 tab） */}
          {pendingCount > 0 && (
            <div
              onClick={() => setTab('friends')}
              className="group relative flex items-center px-3 py-2.5 cursor-pointer hover:bg-bg-page transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-md bg-ok flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] leading-[18px] text-center group-hover:hidden">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              </div>
              <div className="ml-2.5 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-main">确认提醒</span>
                </div>
                <p className="text-xs text-text-sub truncate mt-0.5">
                  {pendingRequests[0]
                    ? `${pendingRequests[0].nickname} 邀请您成为好友。`
                    : '您有新的好友申请。'}
                </p>
              </div>
            </div>
          )}
          {sortedPeerIds.length === 0 ? (
            <div className="text-center text-text-sub text-sm mt-10 px-4">暂无会话，点击 + 添加好友</div>
          ) : (
            sortedPeerIds.map((peerId) => (
              <ConversationItem
                key={peerId}
                peerId={peerId}
                isActive={activePeerId === peerId}
                onClick={() => handleSelectConversation(peerId)}
                onDelete={handleDeleteConversation}
              />
            ))
          )}
        </div>
      )}
      {tab === 'friends' && <FriendsPanel onChatWithFriend={handleChatWithFriend} />}
      {tab === 'groups' && <GroupPanel activeGroupId={activePeerId} onSelect={handleSelectGroup} />}

      {/* 底部：连接状态（点击可重连） */}
      <button
        onClick={() => connState !== 'connected' && useConnStore.getState().requestReconnect()}
        disabled={connState === 'connected'}
        className={`flex items-center gap-1 px-3 py-2 border-t border-line bg-panel text-xs text-left flex-shrink-0 ${
          connState === 'connected' ? 'text-ok cursor-default' : 'text-danger'
        }`}
        title={connState === 'connected' ? undefined : '点击重连'}
      >
        ● {connState === 'connected' ? '通信正常' : connState === 'connecting' ? '连接中' : '通信中断，点击重连'}
      </button>

      <AddFriendDialog open={showAddFriend} onClose={() => setShowAddFriend(false)} />
      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(groupId, name) => {
          useConversationStore.getState().createConversation(groupId, name, '', 'group');
          openConversation(groupId);
          setTab('chats');
          setShowCreateGroup(false);
        }}
      />
    </div>
  );
}
