import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIMClient } from '@/hooks/useIMClient';
import { useChatStore } from '@/stores/useChatStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { openMostRecentConversation } from '@/stores/conversationActions';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useConnStore } from '@/stores/useConnStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { IMShell } from '@/components/IMShell';
import { CallOverlay } from '@/components/CallOverlay';
import { ToastHost } from '@/components/ToastHost';

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { connect, disconnect, errorMessage, kickedReason } = useIMClient();
  const { totalUnread } = useUnreadCount();

  // 页面加载时连接 IM（useIMClient 仅此处调用——它有卸载断连副作用）
  // 会话列表从 localStorage 恢复，但好友列表不持久化——必须在登录时拉取，
  // 否则未进过"好友"页签前所有会话都命中陌生人兜底
  useEffect(() => {
    if (user && token) {
      connect(user.userId, token, user.userName, user.nickname);
      useFriendStore.getState().loadFriends(user.userId);
      useFriendStore.getState().loadPendingRequests(user.userId);
    }
  }, [user, token, connect]);

  // 进入工作台：默认打开最近一个会话
  useEffect(() => {
    openMostRecentConversation();
  }, []);

  // 未读计数更新 title
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) Pomelo Chat` : 'Pomelo Chat';
  }, [totalUnread]);

  // 断线重连（主面板头部通信状态通过 useConnStore 触发）
  const handleReconnect = useCallback(() => {
    if (user && token) {
      disconnect();
      setTimeout(() => connect(user.userId, token, user.userName, user.nickname), 300);
    }
  }, [user, token, disconnect, connect]);

  useEffect(() => {
    useConnStore.getState().setReconnect(handleReconnect);
    return () => {
      useConnStore.getState().setReconnect(null);
    };
  }, [handleReconnect]);

  // 退出登录（MainPanel 底栏通过 useConnStore 触发）
  const handleLogout = useCallback(() => {
    // 1. 先断开 WebSocket（避免状态清除后还有事件回调修改 state）
    disconnect();
    // 2. 清理所有用户状态（消息、会话、好友、群、窗口）
    useChatStore.getState().clearAll();
    useConversationStore.getState().clearAll();
    useFriendStore.getState().clearAll();
    useGroupStore.getState().clearAll();
    useWindowStore.getState().clearAll();
    // 3. 清除认证状态 → ProtectedRoute 自动跳转 /login
    useAuthStore.getState().logout();
  }, [disconnect]);

  useEffect(() => {
    useConnStore.getState().setLogout(handleLogout);
    return () => {
      useConnStore.getState().setLogout(null);
    };
  }, [handleLogout]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-panel">
      {/* 错误提示 toast */}
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-danger text-white px-4 py-2 rounded-lg shadow-lg z-[9999]">
          {errorMessage}
        </div>
      )}
      {/* 被踢下线提示 */}
      {kickedReason && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-warn text-white px-4 py-2 rounded-lg shadow-lg z-[9999]">
          已下线：{kickedReason}
        </div>
      )}

      {/* 聊天界面填满整个视口 */}
      <IMShell />

      {/* 音视频通话浮层（来电/呼出/通话中） */}
      <CallOverlay />

      <ToastHost />
    </div>
  );
}
