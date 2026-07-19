import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/stores/useChatStore';
import { MessageBubble } from '@/components/MessageBubble';

interface Props {
  messages: ChatMessage[];
  currentUserId: string;
}

function shouldShowTimeDivider(prev: ChatMessage | null, curr: ChatMessage): boolean {
  if (!prev) return true;
  return curr.timestamp - prev.timestamp > 5 * 60 * 1000;
}

function formatDividerTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function MessageList({ messages, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-wechat-text-secondary text-sm">
        暂无消息记录
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-3">
      {messages.map((msg, idx) => {
        const prev = idx > 0 ? messages[idx - 1] : null;
        const showTime = shouldShowTimeDivider(prev, msg);
        // '__self__' 是 sendText 里的占位，实际比较时需匹配当前用户
        const isSelf = msg.senderId === currentUserId || msg.senderId === '__self__';

        return (
          <div key={msg.id}>
            {showTime && (
              <div className="text-center my-3">
                <span className="text-xs text-wechat-text-secondary bg-gray-200/60 px-2 py-0.5 rounded">
                  {formatDividerTime(msg.timestamp)}
                </span>
              </div>
            )}
            <MessageBubble message={msg} isSelf={isSelf} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
