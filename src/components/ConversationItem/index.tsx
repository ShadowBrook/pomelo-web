import React, { useEffect, useState } from 'react';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';
import { formatListTime } from '@/utils/imTime';
import { getIMClient } from '@/hooks/useIMClient';
import { GridAvatar } from '@/components/GridAvatar';

interface Props {
  peerId: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: (peerId: string) => void;
}

/** 预览文本前缀着色：[草稿] 红；[图片] 等媒体标签橙 */
function renderPreview(text: string) {
  if (!text) return <span className="text-text-sub">暂无消息</span>;
  const m = text.match(/^(\[[^\]]{1,6}\])\s*(.*)$/);
  if (!m) return <span className="text-text-sub">{text}</span>;
  const tag = m[1];
  const rest = m[2];
  const isDraft = tag === '[草稿]';
  return (
    <span className="text-text-sub">
      <span className={isDraft ? 'text-danger' : 'text-warn'}>{tag}</span>
      {rest ? ` ${rest}` : ''}
    </span>
  );
}

export const ConversationItem = React.memo(function ConversationItem({ peerId, isActive, onClick, onDelete }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const friends = useFriendStore((s) => s.friends);
  const selfId = useAuthStore((s) => s.user?.userId);
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  const groupMembers = useGroupStore((s) => s.groupMembers[peerId]);

  const { nickname, avatar, type } = conversation ?? {};
  const isGroup = type === 'group';
  // 自己与自己的会话不是陌生人
  const isStranger = !!conversation && !isGroup && peerId !== selfId && !friends.some((f) => f.userId === peerId);

  // 群聊无自定义头像时用成员拼图（对齐微信）；成员缓存缺失则懒加载一次
  useEffect(() => {
    if (!conversation || !isGroup || avatar || groupMembers) return;
    const client = getIMClient();
    if (!client) return;
    client.getGroupMembers(peerId)
      .then((ms) => useGroupStore.getState().setMembers(peerId, ms))
      .catch(() => { /* 拉取失败保持字母/拼图兜底，不阻塞列表 */ });
  }, [conversation, isGroup, avatar, peerId, groupMembers]);

  if (!conversation) return null;

  const { lastMessage, lastMessageTime, unreadCount, draft } = conversation;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center px-3 py-2.5 cursor-pointer transition-colors ${
        isActive ? 'bg-selected corner-red' : 'hover:bg-bg-page'
      }`}
    >
      {/* 头像 */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center text-primary text-sm font-bold overflow-hidden">
            <img src={sameOriginMediaUrl(avatar)} alt={nickname} className="w-full h-full object-cover" />
          </div>
        ) : isGroup ? (
          <GridAvatar name={nickname} members={groupMembers} />
        ) : (
          <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center text-primary text-sm font-bold overflow-hidden">
            {nickname.charAt(0).toUpperCase()}
          </div>
        )}
        {isStranger && (
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-sm bg-warn text-white text-[9px] leading-4 text-center font-bold">陌</span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] leading-[18px] text-center group-hover:hidden">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* 两行内容 */}
      <div className="ml-2.5 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-text-main truncate flex items-center gap-1 min-w-0">
            {isGroup && <span className="text-[11px] text-accent flex-shrink-0 font-normal">群</span>}
            <span className="truncate">{nickname}</span>
          </span>
          <span className="text-[11px] text-text-sub flex-shrink-0 ml-2">{formatListTime(lastMessageTime)}</span>
        </div>
        <p className="text-xs truncate mt-0.5">
          {conversation.mentionedMe && !draft && <span className="text-danger">[有人@我] </span>}
          {draft ? renderPreview(`[草稿] ${draft}`) : renderPreview(lastMessage)}
        </p>
      </div>

      {/* 悬停删除 */}
      <button
        onClick={(e) => { stop(e); setShowDeleteConfirm(true); }}
        className="absolute right-2 top-1.5 hidden group-hover:flex w-4 h-4 items-center justify-center text-text-sub hover:text-danger text-xs"
        title="删除会话"
      >
        ✕
      </button>

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 bg-panel flex flex-col items-center justify-center gap-2" onClick={stop}>
          <span className="text-xs text-text-main">删除该会话？</span>
          <div className="flex gap-2">
            <button onClick={(e) => { stop(e); setShowDeleteConfirm(false); }} className="px-3 py-1 text-xs rounded border border-line text-text-sub hover:text-text-main">取消</button>
            <button onClick={(e) => { stop(e); onDelete(peerId); }} className="px-3 py-1 text-xs rounded bg-danger text-white hover:opacity-90">删除</button>
          </div>
        </div>
      )}
    </div>
  );
});
