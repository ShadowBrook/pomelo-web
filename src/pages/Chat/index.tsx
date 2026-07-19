import { useEffect, useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIMClient } from '@/hooks/useIMClient';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore, ChatMessage } from '@/stores/useChatStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { getProfile } from '@/utils/api';
import { ConversationItem } from '@/components/ConversationItem';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { SearchBar } from '@/components/SearchBar';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { AddFriendDialog } from '@/components/AddFriendDialog';
import { FriendsPanel } from '@/components/FriendsPanel';

// 稳定的空数组引用，避免 selector 每次返回新引用导致重渲染
const EMPTY_MESSAGES: ChatMessage[] = [];

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const {
    connect,
    disconnect,
    sendMessage,
    retrySend,
    connectionState,
    markSeen,
    errorMessage,
    kickedReason,
  } = useIMClient();

  const activePeerId = useConversationStore((s) => s.activePeerId);
  const setActivePeer = useConversationStore((s) => s.setActivePeer);
  const createConversation = useConversationStore((s) => s.createConversation);
  const updateDraft = useConversationStore((s) => s.updateDraft);

  // 窄 selector：只订阅当前活动会话（避免任意会话变更触发全组件树重渲染）
  const activeConversation = useConversationStore((s) =>
    activePeerId ? s.conversations[activePeerId] ?? null : null,
  );
  // 窄 selector：只订阅排序后的 peerId 列表（useShallow 避免数组引用变化导致重渲染）
  const sortedPeerIds = useConversationStore(
    useShallow((s) =>
      Object.keys(s.conversations).sort(
        (a, b) =>
          (s.conversations[b].lastMessageTime || 0) -
          (s.conversations[a].lastMessageTime || 0),
      ),
    ),
  );
  // 窄 selector：只订阅当前活动会话的消息
  const activeMessages = useChatStore((s) =>
    activePeerId ? s.messages[activePeerId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES,
  );
  // 历史消息加载状态：undefined（未加载过）视为可加载，false 表示已无更多
  const loadingHistory = useChatStore((s) => s.loadingHistory);
  const hasMoreHistory = useChatStore((s) =>
    activePeerId ? s.hasMoreHistory[activePeerId] !== false : false,
  );

  const { totalUnread } = useUnreadCount();

  // 搜索聊天记录结果
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 侧边栏 Tab：'chats' 会话列表 / 'friends' 好友列表
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'friends'>('chats');
  // 添加好友弹窗
  const [showAddFriend, setShowAddFriend] = useState(false);
  // 退出登录确认弹窗
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 页面加载时连接 IM
  useEffect(() => {
    if (user && token) {
      connect(user.userId, token);
    }
  }, [user, token, connect]);

  // 点击好友发起会话
  const handleChatWithFriend = useCallback((peerId: string, nickname: string, avatar: string) => {
    useConversationStore.getState().createConversation(peerId, nickname, avatar);
    useConversationStore.getState().setActivePeer(peerId);
    setSidebarTab('chats');
  }, []);

  // 打开添加好友弹窗
  const handleOpenAddFriend = useCallback(() => {
    setShowAddFriend(true);
  }, []);

  // 搜索
  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    if (activePeerId) {
      // 搜索当前会话聊天记录
      const results = useChatStore.getState().searchMessages(keyword, activePeerId);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      // 搜索好友
      try {
        const res = await getProfile(keyword);
        if (res.data) {
          const profile = res.data;
          createConversation(profile.userId, profile.nickname, profile.avatar);
          setActivePeer(profile.userId);
        }
      } catch (err) {
        console.error('搜索好友失败:', err);
      }
    }
  }, [activePeerId, createConversation, setActivePeer]);

  // 未读计数更新 title
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) Pomelo Chat` : 'Pomelo Chat';
  }, [totalUnread]);

  // 选择会话 + 自动 markSeen + 首次加载历史
  const handleSelectConversation = useCallback((peerId: string) => {
    setActivePeer(peerId);
    const currentUserId = user?.userId || '';
    const msgs = useChatStore.getState().messages[peerId] || [];
    // 如果该会话没有任何消息，首次加载历史
    if (msgs.length === 0 && currentUserId) {
      useChatStore.getState().loadHistory(currentUserId, peerId);
    }
    // 获取该会话中对方发来的未读消息 ID，发送 SEEN ACK
    const incomingIds = msgs
      .filter(m => m.senderId !== currentUserId && m.senderId !== '__self__' && m.status !== 'seen')
      .map(m => m.id);
    if (incomingIds.length > 0) {
      markSeen(incomingIds);
    }
  }, [setActivePeer, markSeen, user]);

  // 滚动到顶部时加载更早的历史：以当前最早一条消息的 seq 作为 beforeSeq
  const handleLoadMoreHistory = useCallback(() => {
    const uid = user?.userId || '';
    if (!activePeerId || !uid) return;
    const msgs = useChatStore.getState().messages[activePeerId] || [];
    const oldestSeq = msgs[0]?.seq;
    if (oldestSeq !== undefined) {
      useChatStore.getState().loadHistory(uid, activePeerId, oldestSeq);
    }
  }, [activePeerId, user]);

  // 发送文本
  const handleSendText = useCallback((text: string) => {
    if (!activePeerId) return;
    useChatStore.getState().sendText(activePeerId, text, (params) => {
      return sendMessage({ ...params, msgType: params.msgType });
    });
    // 清空草稿
    useConversationStore.getState().updateDraft(activePeerId, '');
  }, [activePeerId, sendMessage]);

  // 发送图片
  const handleSendImage = useCallback((file: File) => {
    if (!activePeerId) return;
    useChatStore.getState().sendImage(activePeerId, file, (params) => {
      return sendMessage({ ...params, msgType: params.msgType });
    });
  }, [activePeerId, sendMessage]);

  // 发送文件
  const handleSendFile = useCallback((file: File) => {
    if (!activePeerId) return;
    useChatStore.getState().sendFile(activePeerId, file, (params) => {
      return sendMessage({ ...params, msgType: params.msgType });
    });
  }, [activePeerId, sendMessage]);

  // 草稿同步
  const handleDraftChange = useCallback((text: string) => {
    if (!activePeerId) return;
    updateDraft(activePeerId, text);
  }, [activePeerId, updateDraft]);

  // 断线重连
  const handleReconnect = useCallback(() => {
    if (user && token) {
      disconnect();
      // 短暂延迟后重连
      setTimeout(() => {
        connect(user.userId, token);
      }, 300);
    }
  }, [user, token, disconnect, connect]);

  // 退出登录
  const handleLogout = useCallback(() => {
    // 1. 先断开 WebSocket（避免状态清除后还有事件回调修改 state）
    disconnect();
    // 2. 清理所有用户状态（消息、会话、好友列表）
    useChatStore.getState().clearAll();
    useConversationStore.getState().clearAll();
    useFriendStore.getState().clearAll();
    // 3. 清除认证状态（persist 中间件会自动同步 localStorage）
    //    ProtectedRoute 检测到 isLoggedIn=false 后会自动跳转到 /login
    useAuthStore.getState().logout();
    setShowLogoutConfirm(false);
  }, [disconnect]);

  const currentUserId = user?.userId || '';

  return (
    <div className="flex h-screen w-screen overflow-hidden min-w-[800px]">
      {/* 错误提示 toast */}
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {errorMessage}
        </div>
      )}
      {/* 被踢下线提示 */}
      {kickedReason && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          已下线：{kickedReason}
        </div>
      )}
      {/* 左侧面板 */}
      <div className="w-[280px] flex-shrink-0 bg-wechat-sidebar flex flex-col border-r border-gray-300">
        {/* Tab 切换 */}
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setSidebarTab('chats')}
            className={`flex-1 py-2 text-sm transition-colors ${sidebarTab === 'chats' ? 'text-wechat-green border-b-2 border-wechat-green font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            聊天
          </button>
          <button
            onClick={() => setSidebarTab('friends')}
            className={`flex-1 py-2 text-sm transition-colors ${sidebarTab === 'friends' ? 'text-wechat-green border-b-2 border-wechat-green font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            好友
          </button>
        </div>

        {/* 搜索栏 + 新建按钮（仅在 chats tab 显示） */}
        {sidebarTab === 'chats' && (
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <SearchBar onSearch={handleSearch} />
              {/* 搜索聊天记录结果面板 */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 max-h-[300px] overflow-y-auto z-50 shadow-lg">
                  {searchResults.map((msg) => (
                    <div
                      key={msg.id}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => setShowSearchResults(false)}
                    >
                      <p className="text-sm text-wechat-text truncate">{msg.content}</p>
                      <p className="text-xs text-wechat-text-secondary">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleOpenAddFriend}
              className="w-8 h-8 flex items-center justify-center rounded bg-wechat-green text-white text-lg hover:bg-wechat-green-dark transition-colors flex-shrink-0 mr-3"
              title="添加好友"
            >
              +
            </button>
          </div>
        )}

        {/* Tab 内容 */}
        {sidebarTab === 'chats' ? (
          <div className="flex-1 overflow-y-auto">
            {sortedPeerIds.length === 0 ? (
              <div className="text-center text-wechat-text-secondary text-sm mt-10 px-4">
                暂无会话，点击 + 添加好友
              </div>
            ) : (
              sortedPeerIds.map((peerId) => (
                <ConversationItem
                  key={peerId}
                  peerId={peerId}
                  isActive={activePeerId === peerId}
                  onClick={() => handleSelectConversation(peerId)}
                />
              ))
            )}
          </div>
        ) : (
          <FriendsPanel onChatWithFriend={handleChatWithFriend} />
        )}

        {/* 底部用户信息 + 连接状态 + 退出 */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-300 bg-wechat-sidebar">
          <div className="flex items-center gap-2 min-w-0">
            {/* 用户头像 */}
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-wechat-green text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                {user?.nickname?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-wechat-text truncate">{user?.nickname || '用户'}</span>
              <span className="text-xs text-wechat-text-secondary">
                {connectionState === 'connected' ? '已连接' : connectionState === 'connecting' ? '连接中...' : '未连接'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-xs text-wechat-text-secondary hover:text-red-500 px-2 py-1 transition-colors flex-shrink-0"
            title="退出登录"
          >
            退出
          </button>
        </div>
      </div>

      {/* 右侧面板 */}
      <div className="flex-1 flex flex-col bg-wechat-bg">
        {/* 连接状态条 */}
        <ConnectionBanner state={connectionState} onReconnect={handleReconnect} />
        {activePeerId && activeConversation ? (
          <>
            {/* 聊天对象昵称 */}
            <div className="h-14 border-b border-gray-300 flex items-center px-4 bg-white/50">
              <span className="text-base font-medium text-wechat-text">
                {activeConversation.nickname}
              </span>
            </div>

            {/* 消息列表 */}
            <MessageList
              messages={activeMessages}
              currentUserId={currentUserId}
              onRetry={retrySend}
              loadingHistory={loadingHistory}
              hasMore={hasMoreHistory}
              onLoadMore={handleLoadMoreHistory}
            />

            {/* 消息输入框 */}
            <MessageInput
              peerId={activePeerId}
              draft={activeConversation.draft}
              onSendText={handleSendText}
              onSendImage={handleSendImage}
              onSendFile={handleSendFile}
              onDraftChange={handleDraftChange}
              disabled={connectionState !== 'connected'}
            />
          </>
        ) : (
          /* 空状态 */
          <div className="flex-1 flex items-center justify-center text-wechat-text-secondary text-sm">
            选择一个会话开始聊天
          </div>
        )}
      </div>

      {/* 添加好友弹窗 */}
      <AddFriendDialog open={showAddFriend} onClose={() => setShowAddFriend(false)} />

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-[300px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-5 text-center">
              <p className="text-sm text-wechat-text">确认退出登录吗？</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-sm text-wechat-text-secondary hover:bg-gray-50 border-r border-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 text-sm text-red-500 hover:bg-gray-50 font-medium transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
