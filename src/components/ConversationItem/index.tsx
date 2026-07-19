import React from 'react';
import { Conversation } from '@/stores/useConversationStore';

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem = React.memo(function ConversationItem({ conversation, isActive, onClick }: Props) {
  const { nickname, avatar, lastMessage, lastMessageTime, unreadCount } = conversation;

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center px-3 py-3 cursor-pointer hover:bg-gray-200/50 transition-colors ${
        isActive ? 'bg-wechat-green/10 border-l-2 border-wechat-green' : ''
      }`}
    >
      {/* 头像 */}
      <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
        {avatar ? (
          <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
        ) : (
          nickname.charAt(0).toUpperCase()
        )}
      </div>

      {/* 内容 */}
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-wechat-text truncate">{nickname}</span>
          <span className="text-xs text-wechat-text-secondary flex-shrink-0 ml-2">{formatTime(lastMessageTime)}</span>
        </div>
        <p className="text-xs text-wechat-text-secondary truncate mt-0.5">{lastMessage || '暂无消息'}</p>
      </div>

      {/* 未读红点 */}
      {unreadCount > 0 && (
        <div className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-[10px] px-1">{unreadCount > 99 ? '99+' : unreadCount}</span>
        </div>
      )}
    </div>
  );
});
