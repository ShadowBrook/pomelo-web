import { useMemo, useState } from 'react';
import { AvatarImg } from '@/components/CachedImg';
import { useConversationStore } from '@/stores/useConversationStore';
import { useGroupStore } from '@/stores/useGroupStore';
import type { ChatMessage } from '@/stores/useChatStore';
import { buildReplySnippet, formatBytes, parseMediaContent } from '@/sdk/media';
import { MsgType } from '@/sdk/types';

/**
 * 转发目标选择器：单聊会话 + 我的群聊混排，关键字过滤。
 * 投递 = 原消息 content 原样重发（媒体复用对象 key，零拷贝）。
 * source 支持伪消息（msgType=FORWARD 的合并转发内容）。
 */
export function ForwardDialog({ source, onForward, onClose }: {
  source: Pick<ChatMessage, 'msgType' | 'content'>;
  onForward: (targetPeerId: string) => void;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState('');
  const conversations = useConversationStore((s) => s.conversations);
  const groups = useGroupStore((s) => s.groups);

  const snippet = buildReplySnippet(source);
  const media = parseMediaContent(source.content);
  const preview = source.msgType === MsgType.TEXT
    ? snippet
    : source.msgType === MsgType.FORWARD
      ? '[聊天记录]'
      : media?.fileName
        ? `[文件] ${media.fileName}${media.size ? ` (${formatBytes(media.size)})` : ''}`
        : snippet;

  const options = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const convOptions = Object.values(conversations)
      .filter((c) => !kw || c.nickname?.toLowerCase().includes(kw) || c.peerId?.toLowerCase().includes(kw))
      .map((c) => ({ peerId: c.peerId, label: c.nickname || c.peerId, avatar: undefined as string | undefined, isGroup: c.type === 'group' }));
    const groupOptions = Object.values(groups)
      .filter((g) => !kw || g.name?.toLowerCase().includes(kw))
      .filter((g) => !convOptions.some((o) => o.peerId === g.groupId))
      .map((g) => ({ peerId: g.groupId, label: g.name || g.groupId, avatar: g.avatar, isGroup: true }));
    return [...convOptions, ...groupOptions];
  }, [conversations, groups, keyword]);

  const forward = (target: string) => {
    onForward(target);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-panel rounded-lg shadow-2xl w-[360px] max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main">
          转发消息
          <div className="text-[11px] text-text-sub mt-0.5 truncate">{preview}</div>
        </div>
        <div className="p-2">
          <input
            autoFocus
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索"
            className="w-full px-2 py-1.5 text-sm bg-black/5 rounded focus:outline-none"
          />
        </div>
        <div className="overflow-y-auto flex-1 pb-2">
          {options.length === 0 && <div className="text-center text-xs text-text-sub py-6">无可转发的会话</div>}
          {options.map((o) => (
            <button
              key={o.peerId}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-black/5 text-left"
              onClick={() => forward(o.peerId)}
            >
              <div className="w-8 h-8 rounded bg-primary/15 flex items-center justify-center text-primary text-xs overflow-hidden flex-shrink-0">
                <AvatarImg url={o.avatar} name={o.label} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-text-main truncate">{o.label}</span>
              {o.isGroup && <span className="text-[10px] text-text-sub ml-auto">群</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
