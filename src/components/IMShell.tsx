import { useWindowStore } from '@/stores/useWindowStore';
import { UserCardTitle } from '@/components/UserCardTitle';
import { MainPanel } from '@/components/MainPanel';
import { ChatWindow } from '@/components/ChatWindow';

/**
 * 主面板列 + 聊天窗列，填满整个视口（父级提供高度）。
 * <p>
 * 桌面（≥ md，768px）：两列恒并排。移动（< md）：列表 / 聊天窗二选一全屏，
 * 由 `mobileChatOpen` 驱动——openConversation 置 true，聊天窗返回按钮置 false。
 * 可见性全部走 Tailwind class（CSS 断点），拖动窗口跨断点时布局自动归位；
 * `showChat` 额外要求 chatPeerId 非空，避免会话被删后移动端两侧同时空白。
 */
export function IMShell() {
  const chatPeerId = useWindowStore((s) => s.chatPeerId);
  const mobileChatOpen = useWindowStore((s) => s.mobileChatOpen);

  const showChat = mobileChatOpen && chatPeerId !== null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-panel">
      {/* 主面板列：深蓝用户卡头部 + 面板内容（移动端在聊天窗打开时让位） */}
      <div
        className={`${showChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[300px] flex-shrink-0 bg-sidebar`}
      >
        <UserCardTitle />
        <MainPanel />
      </div>

      {/* 接缝分隔线（仅桌面） */}
      <div className="hidden md:block w-px bg-line flex-shrink-0" />

      {/* 聊天窗列（移动端仅在会话打开时铺满全屏） */}
      <div
        className={`${showChat ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-auto md:flex-1 min-w-0 bg-panel`}
      >
        <ChatWindow peerId={chatPeerId} />
      </div>
    </div>
  );
}
