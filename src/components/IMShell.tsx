import { useWindowStore, MAIN_PANEL_WIDTH } from '@/stores/useWindowStore';
import { UserCardTitle } from '@/components/UserCardTitle';
import { MainPanel } from '@/components/MainPanel';
import { ChatWindow } from '@/components/ChatWindow';

/**
 * v9 单一复合窗：主面板列 + 聊天窗列恒对接（参考 rb_main1）。
 * 全屏时铺满视口并盖过导航栏（参考 rb_main2）；imVisible=false 时不渲染（参考 rb_main3）。
 */
export function IMShell() {
  const imVisible = useWindowStore((s) => s.imVisible);
  const fullscreen = useWindowStore((s) => s.fullscreen);
  const chatPeerId = useWindowStore((s) => s.chatPeerId);
  if (!imVisible) return null;

  return (
    <div className={fullscreen ? 'fixed inset-0 z-20' : 'fixed inset-x-0 bottom-5 top-[68px] z-0 flex justify-center'}>
      <div
        className={`flex overflow-hidden bg-panel shadow-2xl ring-1 ring-black/10 ${
          fullscreen
            ? 'h-full w-full rounded-none'
            : 'w-[1080px] max-w-[calc(100vw-24px)] h-full rounded-lg'
        }`}
      >
        {/* 主面板列：深蓝用户卡头部 + 面板内容 */}
        <div className="flex flex-col flex-shrink-0 bg-sidebar" style={{ width: MAIN_PANEL_WIDTH }}>
          <UserCardTitle />
          <MainPanel />
        </div>

        {/* 接缝分隔线 */}
        <div className="w-px bg-line flex-shrink-0" />

        {/* 聊天窗列 */}
        <div className="flex-1 flex flex-col min-w-0 bg-panel">
          <ChatWindow peerId={chatPeerId} />
        </div>
      </div>
    </div>
  );
}
