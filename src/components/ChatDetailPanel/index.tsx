import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { getProfile } from '@/utils/api';
import type { DetailTab } from '@/components/DetailTabs';

interface Props {
  peerId: string;
  isGroup: boolean;
  tab: DetailTab;
  onTabChange: (t: DetailTab) => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-xs leading-6">
      <span className="w-16 text-text-sub flex-shrink-0">{label}：</span>
      <span className="text-text-main break-all">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-sub">
      <span className="text-3xl opacity-40">🗂</span>
      <span className="text-xs">{text}</span>
    </div>
  );
}

export function ChatDetailPanel({ peerId, isGroup, tab }: Props) {
  const user = useAuthStore((s) => s.user);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const group = useGroupStore((s) => s.groups[peerId]);
  const memberCount = useGroupStore((s) => s.groupMembers[peerId]?.length);
  // 陌生人资料兜底（好友数据缺头像/昵称时也拉一次）
  const [profile, setProfile] = useState<{ nickname: string; avatar: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isGroup && !friend) {
      getProfile(peerId)
        .then((res) => {
          if (!cancelled && res.data) setProfile({ nickname: res.data.nickname, avatar: res.data.avatar });
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [peerId, isGroup, friend]);

  const displayName = isGroup
    ? group?.name ?? peerId
    : friend?.nickname ?? profile?.nickname ?? peerId;
  const displayAvatar = isGroup ? '' : friend?.avatar ?? profile?.avatar ?? '';

  return (
    <div className="w-[260px] flex-shrink-0 border-l border-line bg-panel flex flex-col min-h-0">
      {tab === 'info' && (
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="flex flex-col items-center gap-1.5 px-4 pt-5 pb-3">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-text-main">{displayName}</span>
            {!isGroup && !friend && <span className="text-[11px] px-1.5 rounded-sm bg-warn text-white">陌生人</span>}
          </div>

          {isGroup ? (
            <div className="px-5 pb-4">
              <div className="text-xs font-medium text-text-main mb-1">基本信息</div>
              <InfoRow label="群名" value={displayName} />
              <InfoRow label="群ID" value={peerId} />
              <InfoRow label="成员数" value={memberCount != null ? `${memberCount}` : '—'} />
            </div>
          ) : (
            <div className="px-5 pb-4">
              <div className="text-xs font-medium text-text-main mb-1">基本信息</div>
              <InfoRow label="ID号" value={peerId} />
              <InfoRow label="邮箱" value="—" />
              <InfoRow label="注册时间" value="—" />
              <InfoRow label="最近登陆" value="—" />
              <InfoRow label="最近 IP" value="—" />
              {friend && (
                <InfoRow label="成为好友" value={friend.friendedAt ? new Date(friend.friendedAt).toLocaleDateString('zh-CN') : '—'} />
              )}
            </div>
          )}

          {/* 底部操作：好友→删除好友；陌生人→加为好友；群聊无操作 */}
          {!isGroup && user && (
            <div className="mt-auto border-t border-line p-3">
              <FooterAction peerId={peerId} isFriend={!!friend} />
            </div>
          )}
        </div>
      )}

      {tab === 'album' && <EmptyState text="暂无相册" />}
      {tab === 'voice' && <EmptyState text="暂无语音介绍" />}
    </div>
  );
}

function FooterAction({ peerId, isFriend }: { peerId: string; isFriend: boolean }) {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'confirmDelete'>('idle');

  if (!user) return null;

  if (isFriend) {
    if (state !== 'confirmDelete') {
      return (
        <button
          onClick={() => setState('confirmDelete')}
          className="w-full py-1.5 text-xs rounded border border-danger/40 text-danger hover:bg-danger/5"
        >
          删除好友
        </button>
      );
    }
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setState('idle')}
          className="flex-1 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main"
        >
          取消
        </button>
        <button
          onClick={async () => {
            const res = await useFriendStore.getState().removeFriend(user.userId, peerId);
            if (res.success) setState('idle');
          }}
          className="flex-1 py-1.5 text-xs rounded bg-danger text-white hover:opacity-90"
        >
          确认删除
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={state === 'sending' || state === 'sent'}
      onClick={async () => {
        setState('sending');
        const res = await useFriendStore.getState().sendFriendRequest(user.userId, peerId);
        setState(res.success ? 'sent' : 'failed');
      }}
      className="w-full py-1.5 text-xs rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
    >
      {state === 'sending' ? '发送中…' : state === 'sent' ? '已发送申请' : state === 'failed' ? '发送失败，点击重试' : '加为好友'}
    </button>
  );
}
