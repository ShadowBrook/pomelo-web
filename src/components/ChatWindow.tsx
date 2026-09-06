import { ChatWindowContent } from '@/components/ChatWindowContent';

/** 聊天窗列内容：peerId 为 null 时显示空态占位 */
export function ChatWindow({ peerId }: { peerId: string | null }) {
  if (!peerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-sub select-none">
        <svg viewBox="0 0 24 24" className="w-16 h-16 opacity-25" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span className="text-sm">暂无会话</span>
      </div>
    );
  }
  return <ChatWindowContent key={peerId} peerId={peerId} />;
}
