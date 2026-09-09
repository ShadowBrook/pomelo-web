import { useState } from 'react';
import { getIMClient } from '@/hooks/useIMClient';
import { useFriendStore } from '@/stores/useFriendStore';
import { toast } from '@/stores/useToastStore';

interface Props {
  groupId: string;
  /** 已在群内的成员 userId，用于过滤掉不可邀请的人 */
  memberIds: string[];
  onClose: () => void;
}

/** 邀请好友入群：列出不在群内的好友，点击即邀请 */
export function InviteMemberDialog({ groupId, memberIds, onClose }: Props) {
  const friends = useFriendStore((s) => s.friends);
  const [pending, setPending] = useState<string | null>(null);
  const candidates = friends.filter((f) => !memberIds.includes(f.userId));

  const invite = async (userId: string) => {
    const client = getIMClient();
    if (!client) return;
    setPending(userId);
    try {
      const res = await client.inviteToGroup(groupId, userId);
      if (res.code === 0) {
        toast('已邀请入群');
        onClose();
      } else {
        toast(res.message || '邀请失败');
      }
    } catch {
      toast('邀请失败');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-panel rounded-lg shadow-xl w-[260px] max-h-[360px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main">邀请好友入群</div>
        <div className="flex-1 overflow-y-auto p-1">
          {candidates.length === 0 ? (
            <div className="text-center text-xs text-text-sub py-4">没有可邀请的好友</div>
          ) : (
            candidates.map((f) => (
              <div
                key={f.userId}
                onClick={() => invite(f.userId)}
                className="flex items-center gap-2 px-2 py-2 rounded hover:bg-bg-page cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs flex-shrink-0">
                  {(f.nickname || f.userName).charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 min-w-0 text-sm text-text-main truncate">{f.nickname || f.userName}</span>
                <span className="flex-shrink-0 text-xs text-accent">{pending === f.userId ? '邀请中…' : '邀请'}</span>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-line">
          <button
            onClick={onClose}
            className="w-full py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
