import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore } from '@/stores/useChatStore';
import { useWindowStore, chatWindowId } from '@/stores/useWindowStore';
import { useConnStore } from '@/stores/useConnStore';
import { getProfile } from '@/utils/api';
import { ConversationItem } from '@/components/ConversationItem';
import { SearchBar } from '@/components/SearchBar';
import { FriendsPanel } from '@/components/FriendsPanel';
import { GroupPanel } from '@/components/GroupPanel';
import { AddFriendDialog } from '@/components/AddFriendDialog';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';

export function MainPanel() {
  const user = useAuthStore((s) => s.user);
  const connState = useConnStore((s) => s.state);
  const activePeerId = useConversationStore((s) => s.activePeerId);
  const openChat = useWindowStore((s) => s.openChat);

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    useWindowStore.getState().close(chatWindowId(peerId));
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

  const tabClass = (tab: string) =>
    `flex-1 py-2 text-sm transition-colors ${
      sidebarTab === tab ? 'text-primary border-b-2 border-primary font-medium' : 'text-text-sub hover:text-text-main'
    }`;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* 个人卡（参考产品：面板顶部） */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-line">
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium">
            {user?.nickname?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-text-main truncate">{user?.nickname || '用户'}</span>
          <span className="text-xs text-text-sub">
            {connState === 'connected' ? '● 已连接' : connState === 'connecting' ? '连接中...' : '未连接'}
          </span>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-line bg-panel">
        <button onClick={() => setSidebarTab('chats')} className={tabClass('chats')}>聊天</button>
        <button onClick={() => setSidebarTab('groups')} className={tabClass('groups')}>群聊</button>
        <button onClick={() => setSidebarTab('friends')} className={tabClass('friends')}>好友</button>
      </div>

      {/* chats tab：搜索 + 添加好友 + 会话列表 */}
      {sidebarTab === 'chats' && (
        <>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white text-lg hover:bg-primary-dark transition-colors flex-shrink-0"
              title="添加好友"
            >
              +
            </button>
          </div>
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

      {/* 底部：连接状态 + 退出 */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-line bg-panel">
        <span className={`text-xs flex items-center gap-1 ${connState === 'connected' ? 'text-ok' : 'text-danger'}`}>
          ● {connState === 'connected' ? '通信正常' : connState === 'connecting' ? '连接中' : '通信中断'}
        </span>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-xs text-text-sub hover:text-danger px-2 py-1 transition-colors"
          title="退出登录"
        >
          退出
        </button>
      </div>

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-5 text-center">
              <p className="text-sm text-text-main">确认退出登录吗？</p>
            </div>
            <div className="flex border-t border-line">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-sm text-text-sub hover:bg-bg-page border-r border-line transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => useConnStore.getState().requestLogout()}
                className="flex-1 py-2.5 text-sm text-danger hover:bg-bg-page font-medium transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}

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
