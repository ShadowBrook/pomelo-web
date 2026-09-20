import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConnStore } from '@/stores/useConnStore';
import { toast } from '@/stores/useToastStore';
import { getIMClient } from '@/hooks/useIMClient';
import { MsgType } from '@/sdk/types';
import { AvatarCropperDialog } from '@/components/AvatarCropperDialog';

type MenuKey = 'profile' | 'password' | 'logout' | 'about' | 'help';

/** 头像图片上限：头像走通用媒体上传通道，客户端先做体积约束 */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** 主面板头部用户卡（深蓝，参考 rb_main1 左上）：头像/昵称/签名/⚙菜单 */
export function UserCardTitle() {
  const user = useAuthStore((s) => s.user);
  const connState = useConnStore((s) => s.state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<'profile' | 'logout' | null>(null);
  const [uploading, setUploading] = useState(false);
  // 待裁剪的原图：选图先进入裁剪弹窗，确认后才走上传
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleMenu = (key: MenuKey) => {
    setMenuOpen(false);
    if (key === 'profile' || key === 'logout') setDialog(key);
    else toast('功能开发中');
  };

  /** 校验选中的原图并进入裁剪 */
  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast('头像图片不能超过 5MB');
      return;
    }
    setPickedFile(file);
  };

  /** 裁剪结果 → 预签名直传对象存储 → 提交对象 key → 服务端回签名 URL 回填 */
  const uploadAvatar = async (file: File) => {
    const client = getIMClient();
    if (!client) {
      toast('连接未就绪');
      return;
    }
    setUploading(true);
    try {
      const up = await client.requestUpload(MsgType.IMAGE, file.name || 'avatar.png', file.size, file.type);
      await client.putFileToPresignedUrl(up.presignedUrl, file);
      const upd = await client.updateProfile(up.objectKey);
      useAuthStore.getState().updateAvatar(upd.avatar);
      toast('头像已更新');
    } catch (e) {
      toast(e instanceof Error ? e.message : '头像更新失败');
    } finally {
      setUploading(false);
    }
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
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title="更换头像"
                  className="relative w-16 h-16 rounded-md overflow-hidden group"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="me" className="w-16 h-16 rounded-md object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-primary text-white flex items-center justify-center text-xl">
                      {user?.nickname?.charAt(0).toUpperCase() || '我'}
                    </div>
                  )}
                  <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/45 text-white text-xs">
                    {uploading ? '上传中…' : '更换头像'}
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    // 允许连续选择同一文件
                    e.target.value = '';
                    if (f) handleFileSelected(f);
                  }}
                />
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

      {/* 头像裁剪弹窗：裁剪确认后走上传 */}
      {pickedFile && (
        <AvatarCropperDialog
          file={pickedFile}
          onClose={() => setPickedFile(null)}
          onConfirm={(f) => {
            setPickedFile(null);
            void uploadAvatar(f);
          }}
        />
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
