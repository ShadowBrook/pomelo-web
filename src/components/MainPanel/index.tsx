import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore } from '@/stores/useChatStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useWindowStore } from '@/stores/useWindowStore';
import { useConnStore } from '@/stores/useConnStore';
import { getProfile } from '@/utils/api';
import { ConversationItem } from '@/components/ConversationItem';
import { SearchBar } from '@/components/SearchBar';
import { FriendsPanel } from '@/components/FriendsPanel';
import { GroupPanel } from '@/components/GroupPanel';
import { AddFriendDialog } from '@/components/AddFriendDialog';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function MainPanel() {
  const connState = useConnStore((s) => s.state);
  const activePeerId = useConversationStore((s) => s.activePeerId);
  const openChat = useWindowStore((s) => s.openChat);
  const { totalUnread } = useUnreadCount();
  const pendingCount = useFriendStore((s) => s.pendingRequests.length);

  const sortedPeerIds = useConversationStore(
    useShallow((s) =>
      Object.keys(s.conversations).sort(
        (a, b) => (s.conversations[b].lastMessageTime || 0) - (s.conversations[a].lastMessageTime || 0),
      ),
    ),
  );

  const [sidebarTab, setSidebarTab] = useState<'chats' | 'groups' | 'friends'>('chats');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleSelectConversation = useCallback(
    (peerId: string) => {
      useConversationStore.getState().setActivePeer(peerId);
      openChat(peerId);
    },
    [openChat],
  );

  const handleDeleteConversation = useCallback((peerId: string) => {
    useConversationStore.getState().removeConversation(peerId);
    useChatStore.getState().clearMessages(peerId);
    const ws = useWindowStore.getState();
    if (ws.chatPeerId === peerId) {
      const next = useConversationStore.getState().getSortedList()[0];
      if (next) ws.openChat(next);
      else ws.closeChat();
    }
  }, []);

  const handleChatWithFriend = useCallback(
    (peerId: string, nickname: string, avatar: string) => {
      useConversationStore.getState().createConversation(peerId, nickname, avatar, 'c2c');
      useConversationStore.getState().setActivePeer(peerId);
      openChat(peerId);
      setSidebarTab('chats');
    },
    [openChat],
  );

  const handleSelectGroup = useCallback(
    (groupId: string, name: string) => {
      useConversationStore.getState().createConversation(groupId, name, '', 'group');
      useConversationStore.getState().setActivePeer(groupId);
      openChat(groupId);
      setSidebarTab('chats');
    },
    [openChat],
  );

  // 搜索：好友 ID/昵称 → 拉资料并开聊
  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword) return;
      try {
        const res = await getProfile(keyword);
        if (res.data) {
          const p = res.data;
          useConversationStore.getState().createConversation(p.userId, p.nickname, p.avatar, 'c2c');
          useConversationStore.getState().setActivePeer(p.userId);
          openChat(p.userId);
        }
      } catch (err) {
        console.error('搜索用户失败:', err);
      }
    },
    [openChat],
  );

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Tab 切换（图标式） */}
      <div className="flex border-b border-line bg-panel">
        <button onClick={() => setSidebarTab('chats')} className={`relative flex-1 py-2.5 flex items-center justify-center transition-colors ${sidebarTab === 'chats' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`} title="聊天">
          <IconChat />
        </button>
        <button onClick={() => setSidebarTab('groups')} className={`flex-1 py-2.5 flex items-center justify-center transition-colors ${sidebarTab === 'groups' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`} title="群聊">
          <IconUsers />
        </button>
        <button onClick={() => setSidebarTab('friends')} className={`relative flex-1 py-2.5 flex items-center justify-center transition-colors ${sidebarTab === 'friends' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`} title="好友">
          <IconBell />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] leading-4 text-center">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* 统计行 + 添加好友 */}
      {sidebarTab === 'chats' && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-line">
          <span className="text-xs text-text-sub">交谈 {sortedPeerIds.length} / 未读 {totalUnread}</span>
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-6 h-6 flex items-center justify-center rounded bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
            title="添加好友"
          >
            +
          </button>
        </div>
      )}

      {/* chats tab：搜索 + 会话列表 */}
      {sidebarTab === 'chats' && (
        <>
          <SearchBar onSearch={handleSearch} />
          <div className="flex-1 overflow-y-auto">
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
        </>
      )}

      {sidebarTab === 'groups' && (
        <GroupPanel activeGroupId={activePeerId} onSelect={handleSelectGroup} />
      )}

      {sidebarTab === 'friends' && (
        <>
          <div className="px-2 py-2 border-b border-line">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full py-1.5 text-sm rounded bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              发起群聊
            </button>
          </div>
          <FriendsPanel onChatWithFriend={handleChatWithFriend} />
        </>
      )}

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
          useConversationStore.getState().setActivePeer(groupId);
          openChat(groupId);
          setSidebarTab('chats');
          setShowCreateGroup(false);
        }}
      />
    </div>
  );
}
