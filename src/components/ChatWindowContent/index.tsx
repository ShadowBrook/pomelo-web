import { useCallback, useState } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useConnStore } from '@/stores/useConnStore';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { ConnectionBanner } from '@/components/ConnectionBanner';

interface ReadStatus {
  readers: Array<{ userId: string; nickname: string; avatar: string }>;
  loading: boolean;
}

export function ChatWindowContent({ peerId }: { peerId: string }) {
  const s = useChatSession(peerId);
  const connState = useConnStore((st) => st.state);
  const [readStatus, setReadStatus] = useState<ReadStatus | null>(null);

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
    <>
      <ConnectionBanner
        state={connState}
        onReconnect={() => useConnStore.getState().requestReconnect()}
      />
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
        disabled={connState !== 'connected'}
      />

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
    </>
  );
}
