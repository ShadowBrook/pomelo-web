import { useCallback, useState } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useWindowStore } from '@/stores/useWindowStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { toast } from '@/stores/useToastStore';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { ChatWindowHeader } from '@/components/ChatWindowHeader';
import { DetailTabs, DetailTab } from '@/components/DetailTabs';
import { ChatDetailPanel } from '@/components/ChatDetailPanel';

interface ReadStatus {
  readers: Array<{ userId: string; nickname: string; avatar: string }>;
  loading: boolean;
}

export function ChatWindowContent({ peerId }: { peerId: string }) {
  const s = useChatSession(peerId);
  const [tab, setTab] = useState<DetailTab>('info');
  const [soundOn, setSoundOn] = useState(true);
  const [readStatus, setReadStatus] = useState<ReadStatus | null>(null);
  const friend = useFriendStore((st) => st.friends.find((f) => f.userId === peerId));

  // 点击群消息已读圈 → 查询已读用户列表
  const handleReadClick = useCallback(
    async (_messageId: string, seq: number) => {
      setReadStatus({ readers: [], loading: true });
      try {
        const resp = await s.queryReadStatus(seq);
        setReadStatus({ readers: resp.readers || [], loading: false });
      } catch {
        setReadStatus(null);
      }
    },
    [s.queryReadStatus],
  );

  if (!s.conversation) {
    return <div className="flex-1 flex items-center justify-center text-sm text-text-sub">会话不存在</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 头部行：标题段(蓝) + 页签(右端 260px) + 窗控图标 */}
      <div className="h-16 flex items-stretch bg-titlebar-chat flex-shrink-0 select-none">
        <ChatWindowHeader peerId={peerId} />
        <div className="flex-1" />
        <DetailTabs isGroup={s.isGroup} isFriend={!!friend} tab={tab} onChange={setTab} />
        <div className="flex items-center gap-1 px-2 flex-shrink-0">
          <button
            onClick={() => { setSoundOn((v) => !v); toast(soundOn ? '提示音已关' : '提示音已开'); }}
            title={soundOn ? '关闭提示音' : '开启提示音'}
            className="w-7 h-7 rounded text-white/85 hover:bg-white/15 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {soundOn ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="M16 9l6 6M22 9l-6 6" />}
            </svg>
          </button>
          <button
            onClick={() => useWindowStore.getState().toggleFullscreen()}
            title={useWindowStore.getState().fullscreen ? '还原' : '全屏'}
            className="w-7 h-7 rounded text-white/85 hover:bg-white/15 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          <button
            onClick={() => useWindowStore.getState().hideIM()}
            title="关闭"
            className="w-7 h-7 rounded text-white/85 hover:bg-danger flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 主体：左聊天区 + 右详情栏 */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-chat-bg">
          <MessageList
            messages={s.messages}
            currentUserId={s.currentUserId}
            onRetry={s.retrySend}
            loadingHistory={s.loadingHistory}
            hasMore={s.hasMore}
            onLoadMore={s.loadMoreHistory}
            isGroup={s.isGroup}
            onReadClick={handleReadClick}
          />
          <MessageInput
            peerId={peerId}
            draft={s.draft}
            onSendText={s.sendText}
            onSendImage={s.sendImage}
            onSendFile={s.sendFile}
            onSendVoice={s.sendVoice}
            onSendVideo={s.sendVideo}
            onSendEmoji={s.sendEmoji}
            onDraftChange={s.onDraftChange}
            quickReplies={['正在处理紧急事情', '有事先离开一会儿']}
          />
        </div>
        <ChatDetailPanel peerId={peerId} isGroup={s.isGroup} tab={tab} onTabChange={setTab} />
      </div>

      {/* 群消息已读成员弹窗 */}
      {readStatus && (
        <div className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center" onClick={() => setReadStatus(null)}>
          <div className="bg-panel rounded-lg shadow-xl w-[260px] max-h-[360px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main">已读成员</div>
            <div className="flex-1 overflow-y-auto p-2">
              {readStatus.loading ? (
                <div className="text-center text-xs text-text-sub py-4">加载中...</div>
              ) : readStatus.readers.length === 0 ? (
                <div className="text-center text-xs text-text-sub py-4">暂无已读</div>
              ) : (
                readStatus.readers.map((r) => (
                  <div key={r.userId} className="flex items-center gap-2 px-2 py-2 hover:bg-bg-page rounded">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                      {(r.nickname || r.userId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-text-main">{r.nickname || r.userId}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
