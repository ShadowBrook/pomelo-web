import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConnStore } from '@/stores/useConnStore';
import { toast } from '@/stores/useToastStore';

type MenuKey = 'profile' | 'password' | 'logout' | 'about' | 'help';

/** 主面板头部用户卡（深蓝，参考 rb_main1 左上）：头像/昵称/签名/⚙菜单 */
export function UserCardTitle() {
  const user = useAuthStore((s) => s.user);
  const connState = useConnStore((s) => s.state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<'profile' | 'logout' | null>(null);

  const handleMenu = (key: MenuKey) => {
    setMenuOpen(false);
    if (key === 'profile' || key === 'logout') setDialog(key);
    else toast('功能开发中');
  };

  const menuItems: Array<{ key: MenuKey; label: string; danger?: boolean }> = [
    { key: 'profile', label: '个人信息' },
    { key: 'password', label: '修改密码' },
    { key: 'logout', label: '退出登陆', danger: true },
    { key: 'about', label: '关于我们' },
    { key: 'help', label: '帮助中心' },
  ];

  return (
    <div className="relative flex items-center gap-2.5 px-3 h-16 flex-shrink-0 bg-titlebar-main select-none">
      {/* 头像（圆形 + 左下在线点，参考图） */}
      <div className="relative flex-shrink-0">
        {user?.avatar ? (
          <img src={user.avatar} alt="me" className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white text-base">
            {user?.nickname?.charAt(0).toUpperCase() || '柚'}
          </div>
        )}
        {connState === 'connected' && (
          <span className="absolute left-0 bottom-0 w-2.5 h-2.5 rounded-full bg-ok border border-white/70" />
        )}
      </div>

      {/* 昵称 + 签名 */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[15px] font-medium text-white truncate leading-tight">{user?.nickname || '我'}</span>
        <span className="text-xs text-white/60 truncate leading-tight mt-0.5">
          <span className="mr-0.5">✏</span>编辑个性签名
        </span>
      </div>

      {/* ⚙ 菜单 */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        title="设置"
        className="w-7 h-7 rounded text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-[60px] z-50 w-32 bg-panel rounded-md shadow-xl border border-line py-1">
            {menuItems.map((it) => (
              <button
                key={it.key}
                onClick={() => handleMenu(it.key)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-page transition-colors ${it.danger ? 'text-danger' : 'text-text-main'}`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 个人信息弹窗（P3 重做，本版沿用简版） */}
      {dialog === 'profile' &&
        createPortal(
          <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setDialog(null)}>
            <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main flex items-center justify-between">
                我的个人信息
                <button onClick={() => setDialog(null)} className="text-text-sub hover:text-text-main text-base leading-none">✕</button>
              </div>
              <div className="p-4 flex flex-col items-center gap-2">
                {user?.avatar ? (
                  <img src={user.avatar} alt="me" className="w-16 h-16 rounded-md object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-primary text-white flex items-center justify-center text-xl">
                    {user?.nickname?.charAt(0).toUpperCase() || '我'}
                  </div>
                )}
                <span className="text-sm font-medium text-text-main">{user?.nickname}</span>
                <span className="text-xs text-text-sub">ID号：{user?.userId}</span>
              </div>
              <div className="border-t border-line p-3 text-right">
                <button onClick={() => setDialog(null)} className="px-4 py-1.5 text-sm rounded bg-panel border border-line text-text-sub hover:text-text-main">
                  关闭
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 退出确认弹窗 */}
      {dialog === 'logout' &&
        createPortal(
          <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setDialog(null)}>
            <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-5 text-center">
                <p className="text-sm text-text-main">确认退出登录吗？</p>
              </div>
              <div className="flex border-t border-line">
                <button onClick={() => setDialog(null)} className="flex-1 py-2.5 text-sm text-text-sub hover:bg-bg-page border-r border-line transition-colors">
                  取消
                </button>
                <button
                  onClick={() => useConnStore.getState().requestLogout()}
                  className="flex-1 py-2.5 text-sm text-danger hover:bg-bg-page font-medium transition-colors"
                >
                  退出
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
