import { useState } from 'react';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';

/**
 * 聊天窗标题栏：对方名 + 标签 + 声音开关（用户卡已迁至主面板标题栏，见 UserCardTitle）。
 * 声音开关为视觉开关（实际通知音实现见 spec §12.3）。
 */
export function ChatWindowHeader({ peerId }: { peerId: string }) {
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const [soundOn, setSoundOn] = useState(true);

  const isGroup = conversation?.type === 'group';
  const isStranger = !isGroup && !friend;

  return (
    <div className="flex items-stretch h-12 min-w-0 flex-1">
      {/* 对方段：对方名 + 标签 + 声音开关（用户卡在主面板标题栏，见 UserCardTitle） */}
      <div className="flex items-center gap-2 px-3 min-w-0 flex-1">
        <span className="text-sm font-medium text-white truncate">{conversation?.nickname ?? peerId}</span>
        {isGroup && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-white/20 text-white flex-shrink-0">群聊</span>}
        {isStranger && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-warn text-white flex-shrink-0">陌生人</span>}
        <button
          onClick={() => setSoundOn((v) => !v)}
          title={soundOn ? '声音开' : '声音关'}
          className="w-6 h-6 rounded text-white/80 hover:text-white hover:bg-white/20 text-sm flex-shrink-0"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );
}
