import { useEffect, useState } from 'react';
import { getIMClient, syncGroupMessages } from '@/hooks/useIMClient';
import { useGroupStore } from '@/stores/useGroupStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { GridAvatar } from '@/components/GridAvatar';
import type { GroupInfo } from '@/sdk/types';

interface Props {
  activeGroupId: string | null;
  onSelect: (groupId: string, name: string) => void;
}

/** 创建时间展示格式：YYYY-MM-DD HH:mm */
const fmtDate = (ts: number) => {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function GroupPanel({ activeGroupId, onSelect }: Props) {
  const groups = useGroupStore((s) => s.groups);
  const setGroups = useGroupStore((s) => s.setGroups);

  const loadGroups = () => {
    const client = getIMClient();
    if (!client) return;
    client.getMyGroups()
      .then((list) => {
        setGroups(list);
        // 群列表加载完成后对每个群做离线增量同步（首次登录时序：连接已建但群列表未加载，
        // connectionChange 同步会空跑，这里兜底）
        list.forEach((g) => syncGroupMessages(g.groupId));
      })
      .catch(() => {});
  };

  useEffect(() => { loadGroups(); }, [setGroups]);

  const groupList = Object.values(groups);

  return (
    <div className="flex-1 overflow-y-auto">
      {groupList.length === 0 ? (
        <div className="text-center text-text-sub text-sm mt-10 px-4">
          暂无群聊
        </div>
      ) : (
        groupList.map((g) => (
          <GroupItem
            key={g.groupId}
            group={g}
            isActive={activeGroupId === g.groupId}
            onClick={() => onSelect(g.groupId, g.name)}
          />
        ))
      )}
    </div>
  );
}

function GroupItem({ group, isActive, onClick }: {
  group: GroupInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const friends = useFriendStore((s) => s.friends);
  const members = useGroupStore((s) => s.groupMembers[group.groupId]);

  const handleInvite = async (friendId: string) => {
    const client = getIMClient();
    if (!client) return;
    setInviting(true);
    try {
      await client.inviteToGroup(group.groupId, friendId);
      setShowInvite(false);
    } catch { /* ignore */ }
    setInviting(false);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-100 ${
          isActive ? 'bg-primary/10' : 'hover:bg-gray-50'
        }`}
      >
        <GridAvatar name={group.name} members={members} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-main truncate">{group.name}</span>
          </div>
          <span className="text-xs text-text-sub">创建于 {fmtDate(group.createdAt)}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowInvite(!showInvite); }}
          className="text-xs text-accent hover:underline px-1 flex-shrink-0"
        >
          邀请
        </button>
      </div>
      {showInvite && (
        <div className="border-b border-gray-100 bg-gray-50 max-h-[200px] overflow-y-auto">
          {friends.length === 0 ? (
            <div className="px-3 py-2 text-xs text-text-sub">暂无好友</div>
          ) : (
            friends.map((f) => (
              <div
                key={f.userId}
                onClick={() => handleInvite(f.userId)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0">
                  {(f.nickname || f.userName).charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate">{f.nickname || f.userName}</span>
                {inviting && <span className="text-text-sub">...</span>}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
