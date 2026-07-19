import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIMClient } from '@/hooks/useIMClient';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore } from '@/stores/useChatStore';
import { ConversationItem } from '@/components/ConversationItem';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const { connect, sendMessage, connectionState } = useIMClient();

  const conversations = useConversationStore((s) => s.conversations);
  const activePeerId = useConversationStore((s) => s.activePeerId);
  const setActivePeer = useConversationStore((s) => s.setActivePeer);
  const createConversation = useConversationStore((s) => s.createConversation);
  const getSortedList = useConversationStore((s) => s.getSortedList);
  const updateDraft = useConversationStore((s) => s.updateDraft);

  const messages = useChatStore((s) => s.messages);

  // 页面加载时连接 IM
  useEffect(() => {
    if (user && token) {
      connect(user.userId, token);
    }
  }, [user, token, connect]);

  // 新建会话
  const handleNewConversation = useCallback(() => {
    const peerId = prompt('输入对方 userId');
    if (peerId && peerId.trim()) {
      const id = peerId.trim();
      createConversation(id);
      setActivePeer(id);
    }
  }, [createConversation, setActivePeer]);

  // 选择会话
  const handleSelectConversation = useCallback((peerId: string) => {
    setActivePeer(peerId);
  }, [setActivePeer]);

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

  const sortedPeerIds = getSortedList();
  const activeConversation = activePeerId ? conversations[activePeerId] : null;
  const activeMessages = activePeerId ? (messages[activePeerId] || []) : [];
  const currentUserId = user?.userId || '';

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 左侧面板 */}
      <div className="w-[280px] flex-shrink-0 bg-wechat-sidebar flex flex-col border-r border-gray-300">
        {/* 搜索栏 + 新建会话 */}
        <div className="p-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="搜索"
            className="flex-1 bg-gray-200/70 rounded px-3 py-1.5 text-sm text-wechat-text placeholder-wechat-text-secondary focus:outline-none focus:ring-1 focus:ring-wechat-green"
          />
          <button
            onClick={handleNewConversation}
            className="w-8 h-8 flex items-center justify-center rounded bg-wechat-green text-white text-lg hover:bg-wechat-green-dark transition-colors flex-shrink-0"
            title="新建会话"
          >
            +
          </button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto">
          {sortedPeerIds.length === 0 ? (
            <div className="text-center text-wechat-text-secondary text-sm mt-10 px-4">
              暂无会话，点击 + 新建
            </div>
          ) : (
            sortedPeerIds.map((peerId) => {
              const conv = conversations[peerId];
              if (!conv) return null;
              return (
                <ConversationItem
                  key={peerId}
                  conversation={conv}
                  isActive={activePeerId === peerId}
                  onClick={() => handleSelectConversation(peerId)}
                />
              );
            })
          )}
        </div>

        {/* 底部状态 */}
        <div className="px-3 py-2 text-xs text-wechat-text-secondary border-t border-gray-300">
          {connectionState === 'connected' ? '已连接' : connectionState === 'connecting' ? '连接中...' : '未连接'}
        </div>
      </div>

      {/* 右侧面板 */}
      <div className="flex-1 flex flex-col bg-wechat-bg">
        {activePeerId && activeConversation ? (
          <>
            {/* 聊天对象昵称 */}
            <div className="h-14 border-b border-gray-300 flex items-center px-4 bg-white/50">
              <span className="text-base font-medium text-wechat-text">
                {activeConversation.nickname}
              </span>
            </div>

            {/* 消息列表 */}
            <MessageList messages={activeMessages} currentUserId={currentUserId} />

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
    </div>
  );
}
