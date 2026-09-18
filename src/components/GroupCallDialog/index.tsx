import { useEffect, useState } from 'react';
import { getIMClient } from '@/hooks/useIMClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { toast } from '@/stores/useToastStore';

/** 群聊通话人数上限（含主叫）。与服务端 call.maxParticipants 默认值一致，超限由服务端兜底 */
export const MAX_GROUP_CALL_PARTICIPANTS = 5;

interface Props {
  groupId: string;
  onClose: () => void;
  onStart: (peerIds: string[], names: Record<string, string>) => void;
}

const displayName = (m: { nickname: string; userName: string; userId: string }) =>
  m.nickname || m.userName || m.userId;

/**
 * 群聊通话选人弹窗：列出群成员（不含自己），多选后发起群聊通话。
 * 成员列表优先用已加载的群资料缓存，缺失时拉取一次。
 */
export function GroupCallDialog({ groupId, onClose, onStart }: Props) {
  const me = useAuthStore((s) => s.user);
  const members = useGroupStore((s) => s.groupMembers[groupId]);
  const groupsLoaded = useGroupStore((s) => s.groupsLoaded);
  const [selected, setSelected] = useState<string[]>([]);
  const maxOthers = MAX_GROUP_CALL_PARTICIPANTS - 1;

  useEffect(() => {
    if (!members && groupsLoaded) {
      getIMClient()?.getGroupMembers(groupId)
        .then((ms) => useGroupStore.getState().setMembers(groupId, ms))
        .catch(() => toast('群成员列表加载失败'));
    }
  }, [members, groupsLoaded, groupId]);

  const candidates = (members ?? []).filter((m) => m.userId !== me?.userId);

  const toggle = (userId: string) => {
    setSelected((ids) => {
      if (ids.includes(userId)) {
        return ids.filter((id) => id !== userId);
      }
      if (ids.length >= maxOthers) {
        toast(`群聊通话最多 ${MAX_GROUP_CALL_PARTICIPANTS} 人`);
        return ids;
      }
      return [...ids, userId];
    });
  };

  const start = () => {
    if (selected.length === 0) {
      toast('请选择通话成员');
      return;
    }
    const names: Record<string, string> = {};
    for (const m of candidates) {
      if (selected.includes(m.userId)) {
        names[m.userId] = displayName(m);
      }
    }
    onStart(selected, names);
  };

  return (
    <div className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-panel rounded-lg shadow-xl w-[280px] max-h-[400px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main">发起群聊通话</div>
        <div className="px-4 py-1.5 text-xs text-text-sub border-b border-line">
          已选 {selected.length}/{maxOthers}（含自己最多 {MAX_GROUP_CALL_PARTICIPANTS} 人）
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {candidates.length === 0 ? (
            <div className="text-center text-xs text-text-sub py-4">
              {members ? '群内没有其他成员' : '群成员加载中…'}
            </div>
          ) : (
            candidates.map((m) => {
              const checked = selected.includes(m.userId);
              return (
                <div
                  key={m.userId}
                  onClick={() => toggle(m.userId)}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-bg-page cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs flex-shrink-0">
                    {displayName(m).charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 min-w-0 text-sm text-text-main truncate">{displayName(m)}</span>
                  <span
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${
                      checked ? 'bg-primary border-primary text-white' : 'border-line text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </div>
              );
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-line flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main"
          >
            取消
          </button>
          <button
            onClick={start}
            disabled={selected.length === 0}
            className="flex-1 py-1.5 text-xs rounded bg-primary text-white disabled:opacity-40"
          >
            通话（{selected.length + 1} 人）
          </button>
        </div>
      </div>
    </div>
  );
}
