import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';

/** 聊天窗标题段：名称 + 人数/陌生人徽章（声音/全屏/关闭在头部行右端，见 ChatWindowContent） */
export function ChatWindowHeader({ peerId }: { peerId: string }) {
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const group = useGroupStore((s) => s.groups[peerId]);
  const memberCount = useGroupStore((s) => s.groupMembers[peerId]?.length);

  const isGroup = conversation?.type === 'group';
  const isStranger = !isGroup && !friend;
  const count = memberCount ?? group?.memberCount;

  return (
    <div className="flex items-center gap-2 px-3 min-w-0 flex-1 h-full">
      <span className="text-sm font-medium text-white truncate">{conversation?.nickname ?? peerId}</span>
      {isGroup && (
        <span className="flex items-center gap-1 text-xs text-white/85 flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5" />
          </svg>
          {count != null ? `${count}人` : ''}
        </span>
      )}
      {isStranger && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-warn text-white flex-shrink-0">陌生人</span>}
    </div>
  );
}
