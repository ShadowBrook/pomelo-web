import { useWindowStore, MAIN_WINDOW_ID } from '@/stores/useWindowStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';

export function TopNavBar() {
  const { totalUnread } = useUnreadCount();
  const hasMain = useWindowStore((s) => s.windows.some((w) => w.kind === 'main'));

  return (
    <div className="h-12 bg-topbar flex items-center justify-between px-4 relative z-[1]">
      <div className="flex items-center gap-2 text-white font-medium">
        <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm">柚</span>
        Pomelo Chat
      </div>
      <button
        onClick={() => (hasMain ? useWindowStore.getState().close(MAIN_WINDOW_ID) : useWindowStore.getState().openMain())}
        className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base"
        title={hasMain ? '收起消息面板' : '打开消息面板'}
      >
        💬
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] leading-[18px] text-center">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
