import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { toast } from '@/stores/useToastStore';
import { getProfile } from '@/utils/api';
import { GridAvatar } from '@/components/GridAvatar';
import type { DetailTab } from '@/components/DetailTabs';

interface Props {
  peerId: string;
  isGroup: boolean;
  tab: DetailTab;
  onTabChange: (t: DetailTab) => void;
}

/** 时间展示格式：YYYY-MM-DD HH:mm（同 GroupPanel 内 fmtDate 写法） */
const fmtDate = (ts?: number) => {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** 节标题：左对齐加粗，前面无图标 */
function SectionTitle({ text, trailing }: { text: string; trailing?: string }) {
  return (
    <div className="text-sm font-medium text-text-main mb-2">
      {text}
      {trailing && <span className="ml-1 text-xs">{trailing}</span>}
    </div>
  );
}

/** 信息行：label 灰固定宽，value 深 */
function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex text-xs leading-6">
      <span className="w-20 text-text-sub flex-shrink-0">{label}：</span>
      <span className="text-text-main break-all min-w-0">{value}</span>
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
  const members = useGroupStore((s) => s.groupMembers[peerId]);
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

  // 群主/创建者：从群成员里查昵称，查不到回退 ownerId
  const owner = members?.find((m) => m.userId === group?.ownerId);
  const ownerName = owner?.nickname ?? group?.ownerId ?? '—';
  const isSelfOwner = !!user && group?.ownerId === user.userId;
  const memberTotal = members?.length ?? group?.memberCount ?? 0;
  // 「我」徽章：红框小标签
  const selfBadge = (
    <span className="ml-1 px-1 rounded-sm border border-danger text-danger text-[10px]">我</span>
  );
  const unsetValue = <span className="text-text-sub">未设置</span>;
  // 其它说明：后端暂无数据源，预留（无数据时整节隐藏）
  const otherNote = '';

  return (
    <div className="w-[260px] flex-shrink-0 border-l border-line bg-panel flex flex-col min-h-0">
      {tab === 'info' && (
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {/* 头部：头像块 + 名称在上 */}
          <div className="px-4 pt-5 pb-4 border-b border-line">
            {isGroup ? (
              <div className="flex items-center gap-3">
                <GridAvatar name={displayName} members={members} className="w-12 h-12" />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium text-text-main truncate">{displayName}</div>
                  <div className="text-xs text-text-sub truncate">群ID: {peerId}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xl flex-shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base font-medium text-text-main truncate">{displayName}</span>
                  {!friend && <span className="text-[11px] px-1.5 rounded-sm bg-warn text-white flex-shrink-0">陌生人</span>}
                </div>
              </div>
            )}
          </div>

          {/* 分节内容 */}
          <div className="px-4 py-4 space-y-5 flex-1">
            {isGroup ? (
              <>
                <section>
                  <SectionTitle text="基本信息" />
                  <InfoRow
                    label="当前群主"
                    value={
                      <span className="inline-flex items-center">
                        {ownerName}
                        {isSelfOwner && selfBadge}
                      </span>
                    }
                  />
                  <InfoRow label="群内昵称" value={user?.nickname ?? '—'} />
                  <InfoRow label="群创建者" value={ownerName} />
                  <InfoRow label="建群时间" value={fmtDate(group?.createdAt)} />
                </section>

                <section>
                  <SectionTitle text="本群公告" />
                  {group?.description ? (
                    <p className="text-xs text-text-main leading-6 break-all whitespace-pre-wrap">{group.description}</p>
                  ) : (
                    <button
                      onClick={() => toast('功能开发中')}
                      className="text-xs text-text-sub leading-6 text-left hover:text-primary"
                    >
                      还没有设置公告，群主可点击进行设置！
                    </button>
                  )}
                </section>

                <section>
                  <SectionTitle text="群员信息" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast('功能开发中')}
                      className="px-3 py-1.5 text-xs rounded border border-primary/60 text-primary hover:bg-primary/5"
                    >
                      管理群员 ({memberTotal}人)
                    </button>
                    <button
                      onClick={() => toast('功能开发中')}
                      className="px-3 py-1.5 text-xs rounded bg-primary text-white hover:bg-primary-dark"
                    >
                      邀请入群
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section>
                  <SectionTitle text="设置备注" trailing="✏" />
                  <InfoRow label="好友备注" value={unsetValue} />
                  <InfoRow label="手机号码" value={unsetValue} />
                  <InfoRow label="更多描述" value={unsetValue} />
                </section>

                <section>
                  <SectionTitle text="基本信息" />
                  <InfoRow label="ID号" value={peerId} />
                  <InfoRow label="邮箱" value="—" />
                  <InfoRow label="注册时间" value="—" />
                  <InfoRow label="最近登陆" value="—" />
                  <InfoRow label="最近 IP" value="—" />
                  {friend && <InfoRow label="成为好友" value={fmtDate(friend.friendedAt)} />}
                </section>

                {otherNote ? (
                  <section>
                    <SectionTitle text="其它说明" />
                    <p className="text-xs text-text-main leading-6 break-all whitespace-pre-wrap">{otherNote}</p>
                  </section>
                ) : null}
              </>
            )}
          </div>

          {/* 底部操作：群=转让/解散；好友=左下红描边删除；陌生人=右下蓝底加好友 */}
          <div className="mt-auto border-t border-line p-3">
            {isGroup ? (
              <div className="flex gap-2">
                <button
                  onClick={() => toast('功能开发中')}
                  className="flex-1 py-1.5 text-xs rounded border border-accent/60 text-accent hover:bg-accent/5"
                >
                  ↻ 转让本群
                </button>
                <button
                  onClick={() => toast('功能开发中')}
                  className="flex-1 py-1.5 text-xs rounded border border-danger/40 text-danger hover:bg-danger/5"
                >
                  ⃠ 解散本群
                </button>
              </div>
            ) : (
              user && <FooterAction peerId={peerId} isFriend={!!friend} />
            )}
          </div>
        </div>
      )}

      {tab === 'album' && <EmptyState text="暂无相册" />}
      {tab === 'voice' && <EmptyState text="暂无语音介绍" />}
    </div>
  );
}

/** 好友/陌生人底部操作（保留状态机，仅重排样式） */
function FooterAction({ peerId, isFriend }: { peerId: string; isFriend: boolean }) {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'confirmDelete'>('idle');

  if (!user) return null;

  if (isFriend) {
    if (state !== 'confirmDelete') {
      // 删除好友：红描边，左下
      return (
        <div className="flex">
          <button
            onClick={() => setState('confirmDelete')}
            className="px-4 py-1.5 text-xs rounded border border-danger/40 text-danger hover:bg-danger/5"
          >
            删除好友
          </button>
        </div>
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

  // 加为好友：蓝底，右下
  return (
    <div className="flex justify-end">
      <button
        disabled={state === 'sending' || state === 'sent'}
        onClick={async () => {
          setState('sending');
          const res = await useFriendStore.getState().sendFriendRequest(user.userId, peerId);
          setState(res.success ? 'sent' : 'failed');
        }}
        className="px-4 py-1.5 text-xs rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {state === 'sending' ? '发送中…' : state === 'sent' ? '已发送申请' : state === 'failed' ? '发送失败，点击重试' : '加为好友'}
      </button>
    </div>
  );
}
