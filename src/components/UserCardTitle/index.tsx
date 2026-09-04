import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { MAIN_PANEL_WIDTH } from '@/stores/useWindowStore';

/** 用户卡标题段（主面板标题栏用）：头像/昵称/⚙ → 简版个人信息弹窗 */
export function UserCardTitle() {
  const user = useAuthStore((s) => s.user);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="flex items-center gap-2 px-3 h-12 flex-shrink-0" style={{ width: MAIN_PANEL_WIDTH }}>
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
      {showProfile &&
        createPortal(
          <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setShowProfile(false)} onPointerDown={(e) => e.stopPropagation()}>
            <div
              className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
