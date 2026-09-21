import { useWindowStore, MAIN_PANEL_WIDTH } from '@/stores/useWindowStore';
import { UserCardTitle } from '@/components/UserCardTitle';
import { MainPanel } from '@/components/MainPanel';
import { ChatWindow } from '@/components/ChatWindow';

/** 主面板列 + 聊天窗列恒对接，填满整个视口（父级提供高度）。 */
export function IMShell() {
  const chatPeerId = useWindowStore((s) => s.chatPeerId);

  return (
    <div className="flex h-full w-full overflow-hidden bg-panel">
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
  );
}
