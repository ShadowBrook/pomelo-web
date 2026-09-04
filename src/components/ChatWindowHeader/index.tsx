import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';

/**
 * 聊天窗双段标题栏：左段=当前登录用户卡（头像/昵称/⚙），右段=对方名+标签。
 * 声音开关为视觉开关（实际通知音实现见 spec §12.3）；auth user 无签名字段，签名行不渲染。
 */
export function ChatWindowHeader({ peerId }: { peerId: string }) {
  const user = useAuthStore((s) => s.user);
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const [soundOn, setSoundOn] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const isGroup = conversation?.type === 'group';
  const isStranger = !isGroup && !friend;

  return (
    <div className="flex items-stretch h-12 min-w-0 flex-1">
      {/* 左段：当前用户卡 */}
      <div className="flex items-center gap-2 px-3 bg-titlebar-to flex-shrink-0">
        {user?.avatar ? (
          <img src={user.avatar} alt="me" className="w-8 h-8 rounded object-cover" />
        ) : (
          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-white text-xs">
            {user?.nickname?.charAt(0).toUpperCase() || '我'}
          </div>
        )}
        <span className="text-sm font-medium text-white truncate max-w-[120px]">{user?.nickname || '我'}</span>
        <button
          onClick={() => setShowProfile(true)}
          title="我的个人信息"
          className="w-6 h-6 rounded text-white/80 hover:text-white hover:bg-white/20 text-sm"
        >
          ⚙
        </button>
      </div>

      {/* 右段：对方名 + 标签（剩余宽度留给窗口控制钮） */}
      <div className="flex items-center gap-2 px-3 min-w-0 flex-1">
        <span className="text-sm font-medium text-white truncate">{conversation?.nickname ?? peerId}</span>
        {isGroup && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-white/20 text-white flex-shrink-0">群聊</span>}
        {isStranger && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-warn text-white flex-shrink-0">陌生人</span>}
        <button
          onClick={() => setSoundOn((v) => !v)}
          title={soundOn ? '关闭提示音' : '开启提示音'}
          className="w-6 h-6 rounded text-white/80 hover:text-white hover:bg-white/20 text-sm flex-shrink-0"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      {/* 简版"我的个人信息"弹窗（portal 渲染到 body，避免冒泡到窗口拖拽条） */}
      {showProfile && createPortal((
        <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onPointerDown={(e) => e.stopPropagation()} onClick={() => setShowProfile(false)}>
          <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main flex items-center justify-between">
              我的个人信息
              <button onClick={() => setShowProfile(false)} className="text-text-sub hover:text-text-main text-base leading-none">✕</button>
            </div>
            <div className="p-4 flex flex-col items-center gap-2">
              {user?.avatar ? (
                <img src={user.avatar} alt="me" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary text-white flex items-center justify-center text-xl">
                  {user?.nickname?.charAt(0).toUpperCase() || '我'}
                </div>
              )}
              <span className="text-sm font-medium text-text-main">{user?.nickname}</span>
              <span className="text-xs text-text-sub">ID号：{user?.userId}</span>
            </div>
            <div className="border-t border-line p-3 text-right">
              <button onClick={() => setShowProfile(false)} className="px-4 py-1.5 text-sm rounded bg-panel border border-line text-text-sub hover:text-text-main">
                关闭
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
