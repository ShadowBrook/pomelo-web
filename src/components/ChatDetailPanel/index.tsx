import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { toast } from '@/stores/useToastStore';
import { getProfile } from '@/utils/api';
import { getIMClient } from '@/hooks/useIMClient';
import { GridAvatar } from '@/components/GridAvatar';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';
import type { GroupMember } from '@/sdk/types';

import { CachedImg, AvatarImg } from '@/components/CachedImg';
interface Props {
  peerId: string;
  isGroup: boolean;
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

/** 群成员行：头像/首字母 + 昵称 + 群主/管理员徽章；有权限时 hover 出现移除按钮 */
function MemberRow({
  member,
  isSelf,
  canRemove,
  onKick,
}: {
  member: { userId: string; userName: string; nickname: string; avatar: string; role: number };
  isSelf: boolean;
  canRemove: boolean;
  onKick: () => void;
}) {
  const name = member.nickname || member.userName || member.userId;
  return (
    <div className="flex items-center gap-2 px-1 py-1 rounded hover:bg-bg-page">
      <CachedImg
        url={member.avatar}
        alt=""
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        fallback={(
          <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      />
      <span className="flex-1 min-w-0 text-xs text-text-main truncate">
        {name}
        {isSelf && <span className="ml-1 px-1 rounded-sm border border-danger text-danger text-[10px]">我</span>}
      </span>
      {member.role === 2 && (
        <span className="flex-shrink-0 text-[10px] px-1 rounded-sm border border-warn text-warn">群主</span>
      )}
      {member.role === 1 && (
        <span className="flex-shrink-0 text-[10px] px-1 rounded-sm border border-primary/60 text-primary">管理员</span>
      )}
      {canRemove && (
        <button
          onClick={onKick}
          title="移出群聊"
          className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-text-sub hover:text-danger hover:bg-danger/10"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ChatDetailPanel({ peerId, isGroup }: Props) {
  const user = useAuthStore((s) => s.user);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const group = useGroupStore((s) => s.groups[peerId]);
  const members = useGroupStore((s) => s.groupMembers[peerId]);
  // 自己与自己的会话：不按陌生人处理，也不展示加好友/删好友操作
  const isSelf = peerId === user?.userId;
  // 陌生人资料兜底（好友数据缺头像/昵称时也拉一次）
  const [profile, setProfile] = useState<{ nickname: string; avatar: string; signature?: string } | null>(null);
  // 移除群成员的确认目标（null 表示无弹窗）
  const [kickTarget, setKickTarget] = useState<GroupMember | null>(null);
  const [kicking, setKicking] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  // 群名修改：弹窗 + 输入 + 提交中
  const [renameOpen, setRenameOpen] = useState(false);
  // 群公告编辑：弹窗 + 输入 + 提交中
  const [descOpen, setDescOpen] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [descSaving, setDescSaving] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renaming, setRenaming] = useState(false);
  // 群主转让：目标选择弹窗；解散：二次确认
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<GroupMember | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [dissolveConfirm, setDissolveConfirm] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const submitTransfer = async () => {
    if (!transferTarget || transferring) return;
    setTransferring(true);
    try {
      await getIMClient()!.transferGroup(peerId, transferTarget.userId);
      toast(`已转让给 ${transferTarget.nickname || transferTarget.userName}`);
      setTransferOpen(false);
      setTransferTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : '转让失败');
    } finally {
      setTransferring(false);
    }
  };

  const submitDissolve = async () => {
    if (dissolving) return;
    setDissolving(true);
    try {
      await getIMClient()!.dissolveGroup(peerId);
      toast('群聊已解散');
      setDissolveConfirm(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : '解散失败');
    } finally {
      setDissolving(false);
    }
  };

  // 群成员懒加载兜底：成员列表只在 member-change 推送时刷新，
  // 打开群聊详情时没有就主动拉一次（群主/创建者昵称、群头像都依赖它）
  useEffect(() => {
    if (!isGroup || members) return;
    getIMClient()
      ?.getGroupMembers(peerId)
      .then((ms) => useGroupStore.getState().setMembers(peerId, ms))
      .catch(() => {});
  }, [peerId, isGroup, members]);

  useEffect(() => {
    let cancelled = false;
    if (!isGroup && !friend) {
      getProfile(peerId)
        .then((res) => {
          // 后端 ok() 把字段挂在顶层（{code, nickname, avatar, ...}），没有 data 包裹层
          if (!cancelled && res.nickname) {
            setProfile({ nickname: res.nickname, avatar: sameOriginMediaUrl(res.avatar), signature: res.signature || '' });
          }
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
  const displaySignature = isGroup ? '' : friend?.signature ?? profile?.signature ?? '';

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

  // 我的角色：2=群主 1=管理员 0=成员（不在群内为 -1）；仅群主/管理员可移除成员
  const myRole = members?.find((m) => m.userId === user?.userId)?.role ?? -1;
  const canRemove = (m: GroupMember) =>
    myRole >= 1 && m.userId !== user?.userId && m.role !== 2 && myRole > m.role;
  // 群名修改同权限：群主/管理员
  const canRename = myRole >= 1;

  const openRename = () => {
    setRenameInput(group?.name ?? '');
    setRenameOpen(true);
  };

  const applyGroupName = (name: string) => {
    useGroupStore.getState().updateGroup(peerId, { name });
    // 会话昵称镜像群名（聊天窗标题、会话列表都读它）
    useConversationStore.setState((s) => {
      const conv = s.conversations[peerId];
      if (!conv) return s;
      return { conversations: { ...s.conversations, [peerId]: { ...conv, nickname: name } } };
    });
  };

  const openDescEditor = () => {
    setDescInput(group?.description ?? '');
    setDescOpen(true);
  };

  const submitDesc = async () => {
    const client = getIMClient();
    if (!client || descSaving) return;
    setDescSaving(true);
    try {
      const text = descInput.trim();
      await client.updateGroupDescription(peerId, text);
      // 本地即时反馈；INFO_UPDATED 推送（含本机）随后到达，幂等
      useGroupStore.getState().updateGroup(peerId, { description: text });
      toast(text ? '公告已更新' : '公告已清空');
      setDescOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : '更新失败');
    } finally {
      setDescSaving(false);
    }
  };

  const submitRename = async () => {
    const name = renameInput.trim();
    const client = getIMClient();
    if (!name || !client || renaming) return;
    setRenaming(true);
    try {
      await client.updateGroupName(peerId, name);
      applyGroupName(name);
      toast('群名已修改');
      setRenameOpen(false);
      // INFO_UPDATED 推送稍后到达（含本机），与本地乐观更新幂等
    } catch (e) {
      toast(e instanceof Error ? e.message : '修改失败');
    } finally {
      setRenaming(false);
    }
  };

  const confirmKick = async () => {
    const target = kickTarget;
    const client = getIMClient();
    if (!target || !client) return;
    setKicking(true);
    try {
      const res = await client.kickMember(peerId, target.userId);
      if (res.code === 0) {
        // 被移除者与其本人都会收到 KICKED 推送；本地先移除保证即时反馈
        useGroupStore.getState().removeMember(peerId, target.userId);
        toast('已移出群聊');
        setKickTarget(null);
      } else {
        toast(res.message || '移除失败');
      }
    } catch {
      toast('移除失败');
    } finally {
      setKicking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* 头部：头像块 + 名称在上 */}
        <div className="px-4 pt-5 pb-4 border-b border-line">
          {isGroup ? (
            <div className="flex items-center gap-3">
              <GridAvatar name={displayName} members={members} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-medium text-text-main truncate">{displayName}</span>
                  {canRename && (
                    <button
                      onClick={openRename}
                      title="修改群名"
                      className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-text-sub hover:text-primary hover:bg-primary/10"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="text-xs text-text-sub truncate">群ID: {peerId}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CachedImg
                url={displayAvatar}
                alt={displayName}
                className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                fallback={(
                  <div className="w-14 h-14 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xl flex-shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base font-medium text-text-main truncate">{displayName}</span>
                {isSelf && <span className="text-[11px] px-1.5 rounded-sm bg-primary/15 text-primary flex-shrink-0">自己</span>}
                {!friend && !isSelf && <span className="text-[11px] px-1.5 rounded-sm bg-warn text-white flex-shrink-0">陌生人</span>}
              </div>
              {displaySignature && (
                <div className="text-xs text-text-sub truncate w-full">{displaySignature}</div>
              )}
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
                  label="群名称"
                  value={
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{displayName}</span>
                      {canRename ? (
                        <button onClick={openRename} className="flex-shrink-0 text-primary hover:underline">
                          修改
                        </button>
                      ) : (
                        <span className="flex-shrink-0 text-text-sub">（群主/管理员可修改）</span>
                      )}
                    </span>
                  }
                />
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
                <div className="flex items-start justify-between gap-2">
                  <SectionTitle text="本群公告" />
                  {canRename && (
                    <button
                      onClick={openDescEditor}
                      title={group?.description ? '编辑公告' : '设置公告'}
                      className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-text-sub hover:text-primary hover:bg-primary/10"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                  )}
                </div>
                {group?.description ? (
                  <p className="text-xs text-text-main leading-6 break-all whitespace-pre-wrap">{group.description}</p>
                ) : canRename ? (
                  <button
                    onClick={openDescEditor}
                    className="text-xs text-text-sub leading-6 text-left hover:text-primary"
                  >
                    还没有设置公告，点击此处设置
                  </button>
                ) : (
                  <p className="text-xs text-text-sub leading-6">群主/管理员还没有设置公告</p>
                )}
              </section>

              <section>
                <SectionTitle text={`群员信息 (${memberTotal}人)`} />
                {members ? (
                  members.map((m) => (
                    <MemberRow
                      key={m.userId}
                      member={m}
                      isSelf={m.userId === user?.userId}
                      canRemove={canRemove(m)}
                      onKick={() => setKickTarget(m)}
                    />
                  ))
                ) : (
                  <div className="text-xs text-text-sub leading-6">加载中…</div>
                )}
                <button
                  onClick={() => setInviteOpen(true)}
                  className="w-full flex items-center gap-2 px-1 py-1.5 mt-1 rounded border border-dashed border-line text-xs text-text-sub hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full border border-dashed border-current flex items-center justify-center text-sm leading-none flex-shrink-0">
                    +
                  </span>
                  邀请好友入群
                </button>
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
            isSelfOwner ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setTransferOpen(true)}
                  className="flex-1 py-1.5 text-xs rounded border border-accent/60 text-accent hover:bg-accent/5"
                >
                  ↻ 转让本群
                </button>
                <button
                  onClick={() => setDissolveConfirm(true)}
                  className="flex-1 py-1.5 text-xs rounded border border-danger/40 text-danger hover:bg-danger/5"
                >
                  ⃠ 解散本群
                </button>
              </div>
            ) : null
          ) : (
            user && !isSelf && <FooterAction peerId={peerId} isFriend={!!friend} />
          )}
        </div>
      </div>

      {/* 移出群聊确认弹窗 */}
      {kickTarget && (
        <div
          className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center"
          onClick={() => { if (!kicking) setKickTarget(null); }}
        >
          <div className="bg-panel rounded-lg shadow-xl w-[240px] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-text-main mb-1">移出群聊</div>
            <div className="text-xs text-text-sub mb-4 break-all">
              确定将 {kickTarget.nickname || kickTarget.userName || kickTarget.userId} 移出该群？
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setKickTarget(null)}
                disabled={kicking}
                className="flex-1 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main disabled:opacity-60"
              >
                取消
              </button>
              <button
                onClick={confirmKick}
                disabled={kicking}
                className="flex-1 py-1.5 text-xs rounded bg-danger text-white hover:opacity-90 disabled:opacity-60"
              >
                {kicking ? '移除中…' : '移除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 群主转让：目标成员选择 */}
      {transferOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center"
          onClick={() => { if (!transferring) setTransferOpen(false); }}
        >
          <div className="bg-panel rounded-lg shadow-xl w-[240px] max-h-[360px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main">选择新群主</div>
            <div className="flex-1 overflow-y-auto p-1">
              {(members ?? [])
                .filter((m) => m.userId !== user?.userId)
                .map((m) => (
                  <div
                    key={m.userId}
                    onClick={() => setTransferTarget(m)}
                    className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-bg-page ${transferTarget?.userId === m.userId ? 'bg-bg-page' : ''}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs flex-shrink-0 overflow-hidden">
                      <AvatarImg url={m.avatar} name={m.nickname || m.userName} className="w-full h-full object-cover" />
                    </div>
                    <span className="flex-1 min-w-0 text-sm text-text-main truncate">{m.nickname || m.userName}</span>
                    {transferTarget?.userId === m.userId && <span className="text-xs text-primary">✓</span>}
                  </div>
                ))}
            </div>
            <div className="border-t border-line p-3 flex justify-end gap-2">
              <button
                onClick={() => setTransferOpen(false)}
                disabled={transferring}
                className="px-3 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main disabled:opacity-60"
              >
                取消
              </button>
              <button
                onClick={submitTransfer}
                disabled={!transferTarget || transferring}
                className="px-3 py-1.5 text-xs rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {transferring ? '转让中…' : '确认转让'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 解散群聊二次确认 */}
      {dissolveConfirm && (
        <div
          className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center"
          onClick={() => { if (!dissolving) setDissolveConfirm(false); }}
        >
          <div className="bg-panel rounded-lg shadow-xl w-[240px] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-text-main mb-1">解散群聊</div>
            <div className="text-xs text-text-sub mb-4">
              解散后所有成员将被移出，本群不再可用（聊天记录保留在服务端）。确定解散？
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDissolveConfirm(false)}
                disabled={dissolving}
                className="flex-1 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main disabled:opacity-60"
              >
                取消
              </button>
              <button
                onClick={submitDissolve}
                disabled={dissolving}
                className="flex-1 py-1.5 text-xs rounded bg-danger text-white hover:opacity-90 disabled:opacity-60"
              >
                {dissolving ? '解散中…' : '确认解散'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑群公告弹窗 */}
      {descOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center"
          onClick={() => { if (!descSaving) setDescOpen(false); }}
        >
          <div className="bg-panel rounded-lg shadow-xl w-[320px] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-text-main mb-3">编辑群公告</div>
            <textarea
              autoFocus
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              maxLength={500}
              rows={5}
              placeholder="输入群公告（最多 500 字；留空表示清空公告）"
              className="w-full px-2 py-1.5 mb-1 text-xs rounded border border-line bg-bg-page text-text-main focus:outline-none focus:border-primary resize-none"
            />
            <div className="text-[11px] text-text-sub mb-3 text-right">{descInput.length}/500</div>
            <div className="flex gap-2">
              <button
                onClick={() => setDescOpen(false)}
                disabled={descSaving}
                className="flex-1 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main disabled:opacity-60"
              >
                取消
              </button>
              <button
                onClick={() => void submitDesc()}
                disabled={descSaving}
                className="flex-1 py-1.5 text-xs rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {descSaving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改群名弹窗 */}
      {renameOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center"
          onClick={() => { if (!renaming) setRenameOpen(false); }}
        >
          <div className="bg-panel rounded-lg shadow-xl w-[240px] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-text-main mb-3">修改群名</div>
            <input
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void submitRename(); }}
              maxLength={32}
              placeholder="输入新的群名"
              className="w-full px-2 py-1.5 mb-4 text-xs rounded border border-line bg-bg-page text-text-main focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRenameOpen(false)}
                disabled={renaming}
                className="flex-1 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main disabled:opacity-60"
              >
                取消
              </button>
              <button
                onClick={() => void submitRename()}
                disabled={renaming || !renameInput.trim()}
                className="flex-1 py-1.5 text-xs rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {renaming ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 邀请好友入群弹窗 */}
      {inviteOpen && (
        <InviteMemberDialog
          groupId={peerId}
          memberIds={members?.map((m) => m.userId) ?? []}
          onClose={() => setInviteOpen(false)}
        />
      )}
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
