import { useCallback, useState } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useGroupReadCounts } from '@/hooks/useGroupReadCounts';
import { useBrowserFullscreen } from '@/hooks/useBrowserFullscreen';
import { useWindowStore } from '@/stores/useWindowStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { toast } from '@/stores/useToastStore';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { ChatWindowHeader } from '@/components/ChatWindowHeader';
import type { ChatMessage } from '@/stores/useChatStore';
import { DetailTabs, detailLabel } from '@/components/DetailTabs';
import { ChatDetailPanel } from '@/components/ChatDetailPanel';
import { ForwardDialog } from '@/components/ForwardDialog';
import { buildForwardContent, buildReplySnippet } from '@/sdk/media';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useChatStore } from '@/stores/useChatStore';
import { MsgType } from '@/sdk/types';

interface ReadStatus {
  readers: Array<{ userId: string; nickname: string; avatar: string }>;
  loading: boolean;
}

export function ChatWindowContent({ peerId }: { peerId: string }) {
  const s = useChatSession(peerId);
  const { isFullscreen, toggle: toggleFullscreen } = useBrowserFullscreen();
  const [detailOpen, setDetailOpen] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [readStatus, setReadStatus] = useState<ReadStatus | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const me = useAuthStore((st) => st.user);
  // 自己被移出该群：详情栏改为提示，输入区禁用。
  // 两条来源：实时 KICKED 推送打标记；或群列表已加载但里面没有这个群（刷新/离线期间被移除）。
  const removedByPush = useGroupStore((st) => !!st.removedGroups[peerId]);
  const missingFromMyGroups = useGroupStore((st) => st.groupsLoaded && !st.groups[peerId]);
  const kicked = s.isGroup && (removedByPush || missingFromMyGroups);
  const readCounts = useGroupReadCounts(peerId, s.isGroup && !kicked, s.messages, s.currentUserId);
  const groupStoreMemberCount = useGroupStore((st) => st.groups[peerId]?.memberCount);
  const groupReadState = useChatStore((st) => st.groupReadStates[peerId]);
  // 成员数优先用已读游标表的实际行数（更准），回退群列表快照
  const groupMemberCount = s.isGroup
    ? (groupReadState ? Object.keys(groupReadState).length : groupStoreMemberCount)
    : undefined;
  const toggleSelect = useCallback((m: ChatMessage) => {
    setSelectedIds((ids) => ids.includes(m.id) ? ids.filter((i) => i !== m.id) : [...ids, m.id]);
  }, []);
  const startSelect = useCallback((m: ChatMessage) => {
    setSelecting(true);
    setSelectedIds([m.id]);
  }, []);
  const exitSelect = useCallback(() => { setSelecting(false); setSelectedIds([]); }, []);
  // 合并转发：按选中顺序构建 FORWARD 消息投递到当前会话
  const forwardMerged = useCallback(() => {
    if (selectedIds.length === 0) return;
    const byId = new Map((s.messages || []).map((m) => [m.id, m]));
    const msgs = selectedIds.map((id) => byId.get(id)).filter((m): m is ChatMessage => !!m);
    const content = buildForwardContent('', msgs, me?.nickname || me?.userName);
    // 构建伪消息进入转发选择框，由用户挑选目标会话（forwardTo 按目标类型路由 C2C/群）
    setForwardMsg({ msgType: MsgType.FORWARD, content } as ChatMessage);
    exitSelect();
  }, [selectedIds, s, exitSelect, me]);
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
      {/* 头部行：标题段(蓝) + 右上角窗控图标 */}
      <div className="h-16 flex items-stretch bg-titlebar-chat flex-shrink-0 select-none">
        <ChatWindowHeader peerId={peerId} />
        <div className="flex-1" />
        <div className="h-full flex items-start justify-end gap-1 px-2 pt-1 flex-shrink-0">
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
            onClick={toggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏（Esc 退出）'}
            className="w-7 h-7 rounded text-white/85 hover:bg-white/15 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          <button
            onClick={() => useWindowStore.getState().closeChat()}
            title="关闭会话"
            className="w-7 h-7 rounded text-white/85 hover:bg-danger flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 主体：左聊天区 + 右详情栏（详情栏头部条在面板顶部，不占蓝条） */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-chat-bg">
          {selecting && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-panel border-b border-line text-xs">
              <span className="text-text-sub">已选 {selectedIds.length} 条</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50" disabled={selectedIds.length === 0} onClick={forwardMerged}>合并转发</button>
                <button className="px-3 py-1 border border-line rounded" onClick={exitSelect}>取消</button>
              </div>
            </div>
          )}
          <MessageList
            messages={s.messages}
            currentUserId={s.currentUserId}
            onRetry={s.retrySend}
            loadingHistory={s.loadingHistory}
            hasMore={s.hasMore}
            onLoadMore={s.loadMoreHistory}
            isGroup={s.isGroup}
            onReadClick={handleReadClick}
            readCounts={readCounts}
            groupMemberCount={groupMemberCount}
            onReply={s.setReplyTo}
            onForward={setForwardMsg}
            selecting={selecting}
            selectedIds={new Set(selectedIds)}
            onToggleSelect={toggleSelect}
            onStartSelect={startSelect}
          />
          <MessageInput
            peerId={peerId}
            disabled={kicked}
            draft={s.draft}
            replyPreview={s.replyTo ? {
              senderName: s.replyTo.senderNickname || s.replyTo.senderUserName || s.replyTo.senderId,
              snippet: buildReplySnippet(s.replyTo),
            } : undefined}
            onCancelReply={() => s.setReplyTo(null)}
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
        {kicked ? (
          <div className="w-[260px] flex-shrink-0 border-l border-line bg-panel flex flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-sm text-text-main">您已被移出群聊</span>
            <span className="text-xs text-text-sub leading-5">群资料与成员列表已不可见，如需继续参与请让群主重新邀请你</span>
          </div>
        ) : detailOpen ? (
          <div className="w-[260px] flex-shrink-0 border-l border-line bg-panel flex flex-col min-h-0">
            <DetailTabs label={detailLabel(s.isGroup, !!friend)} onToggle={() => setDetailOpen(false)} />
            <ChatDetailPanel peerId={peerId} isGroup={s.isGroup} />
          </div>
        ) : (
          <button
            onClick={() => setDetailOpen(true)}
            aria-expanded={false}
            title={`展开${detailLabel(s.isGroup, !!friend)}`}
            className="w-9 flex-shrink-0 border-l border-line bg-panel flex flex-col items-center gap-2 py-3 text-xs text-text-main hover:text-primary transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            <span className="[writing-mode:vertical-rl] tracking-widest">{detailLabel(s.isGroup, !!friend)}</span>
          </button>
        )}
      </div>

      {/* 转发目标选择弹窗 */}
      {forwardMsg && (
        <ForwardDialog
          source={forwardMsg}
          onForward={(target) => s.forwardTo(target, forwardMsg)}
          onClose={() => setForwardMsg(null)}
        />
      )}

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
