import React, { useState } from 'react';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';

interface Props {
  peerId: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: (peerId: string) => void;
}

export const ConversationItem = React.memo(function ConversationItem({ peerId, isActive, onClick, onDelete }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const friends = useFriendStore((s) => s.friends);
  // 各自从 store 订阅自己的数据，避免接收整个 conversation 对象作为 props
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  if (!conversation) return null;

  const { nickname, avatar, lastMessage, lastMessageTime, unreadCount } = conversation;
  const isStranger = conversation.type === 'c2c' && !friends.some((f) => f.userId === peerId);

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(peerId);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-center px-3 py-3 cursor-pointer hover:bg-gray-200/50 transition-colors relative ${
        isActive ? 'bg-primary/10 border-l-2 border-primary' : ''
      }`}
    >
      {/* 头像 */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
          ) : (
            nickname.charAt(0).toUpperCase()
          )}
        </div>
        {isStranger && (
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-sm bg-warn text-white text-[9px] leading-4 text-center font-bold">陌</span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] leading-[18px] text-center group-hover:hidden">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* 内容 */}
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-text-main truncate">{nickname}</span>
          <span className="text-xs text-text-sub flex-shrink-0 ml-2">{formatTime(lastMessageTime)}</span>
        </div>
        <p className="text-xs text-text-sub truncate mt-0.5">{lastMessage || '暂无消息'}</p>
      </div>

      {/* 悬停时显示的删除按钮 */}
      <button
        onClick={handleDeleteClick}
        className={`ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-gray-400 hover:bg-red-500 text-white text-xs flex items-center justify-center transition-all ${
          unreadCount > 0 ? 'hidden group-hover:flex' : 'hidden group-hover:flex'
        }`}
        title="删除会话"
      >
        ✕
      </button>

      {/* 删除确认浮层 */}
      {showDeleteConfirm && (
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 z-10 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-text-main whitespace-nowrap">删除该会话？</span>
          <button
            onClick={handleConfirmDelete}
            className="text-xs text-red-500 hover:text-red-600 font-medium px-1"
          >
            删除
          </button>
          <button
            onClick={handleCancelDelete}
            className="text-xs text-text-sub hover:text-text-main px-1"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
});
