import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/stores/useChatStore';
import { MessageBubble } from '@/components/MessageBubble';
import { formatMsgTime } from '@/utils/imTime';

interface Props {
  messages: ChatMessage[];
  currentUserId: string;
  onRetry?: (messageId: string) => void;
  onLoadMore?: () => void;
  loadingHistory?: boolean;
  hasMore?: boolean;
  isGroup?: boolean;
  onReadClick?: (messageId: string, seq: number) => void;
  onReply?: (m: ChatMessage) => void;
  onForward?: (m: ChatMessage) => void;
  selecting?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (m: ChatMessage) => void;
  onStartSelect?: (m: ChatMessage) => void;
}

function shouldShowTimeDivider(prev: ChatMessage | null, curr: ChatMessage): boolean {
  if (!prev) return true;
  return curr.timestamp - prev.timestamp > 5 * 60 * 1000;
}

export function MessageList({
  messages,
  currentUserId,
  onRetry,
  onLoadMore,
  loadingHistory = false,
  hasMore = false,
  isGroup,
  onReadClick,
  onReply,
  onForward,
  selecting,
  selectedIds,
  onToggleSelect,
  onStartSelect,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // 加载历史前的滚动位置（用于加载完成后恢复，避免内容跳动）
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);

  // 滚动事件：到顶部时触发加载更早的历史
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el) return;
    // 50px 阈值，避免边界抖动
    if (el.scrollTop < 50 && onLoadMore && !loadingHistory && hasMore && prevScrollHeightRef.current === 0) {
      // 保存加载前的滚动尺寸，便于加载后恢复
      prevScrollHeightRef.current = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;
      onLoadMore();
    }
  };

  // 历史加载完成（loadingHistory 从 true 变 false）时恢复滚动位置
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!loadingHistory && prevScrollHeightRef.current > 0) {
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - prevScrollHeightRef.current + prevScrollTopRef.current;
      prevScrollHeightRef.current = 0;
      prevScrollTopRef.current = 0;
    }
  }, [loadingHistory]);

  // 新消息到达时自动滚动到底部；历史加载恢复期间不滚动，避免跳动
  useEffect(() => {
    if (prevScrollHeightRef.current === 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-sub text-sm bg-chat-bg">
        {loadingHistory ? '加载历史消息...' : '暂无消息记录'}
      </div>
    );
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-3 bg-chat-bg">
      {/* 顶部加载提示 */}
      {loadingHistory && (
        <div className="text-center py-2">
          <span className="text-xs text-text-sub">加载历史消息...</span>
        </div>
      )}
      {messages.map((msg, idx) => {
        const prev = idx > 0 ? messages[idx - 1] : null;
        const showTime = shouldShowTimeDivider(prev, msg);
        // '__self__' 是 sendText 里的占位，实际比较时需匹配当前用户
        const isSelf = msg.senderId === currentUserId || msg.senderId === '__self__';

        return (
          <div key={msg.id}>
            <div className={`mb-1 ${isSelf ? 'text-right pr-[52px]' : 'text-left pl-[52px]'}`}>
              {showTime && <span className="text-[11px] text-text-sub">{formatMsgTime(msg.timestamp)}</span>}
            </div>
            <MessageBubble message={msg} isSelf={isSelf} onRetry={onRetry} isGroup={isGroup} onReadClick={onReadClick} onReply={onReply} onForward={onForward} selecting={selecting} selected={selectedIds?.has(msg.id)} onToggleSelect={onToggleSelect} onStartSelect={onStartSelect} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
