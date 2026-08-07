import { useEffect } from 'react';
import { getIMClient } from '@/hooks/useIMClient';
import { useGroupStore } from '@/stores/useGroupStore';
import { useConversationStore } from '@/stores/useConversationStore';
import type { GroupInfo } from '@/sdk/types';

interface Props {
  activeGroupId: string | null;
  onSelect: (groupId: string, name: string) => void;
}

export function GroupPanel({ activeGroupId, onSelect }: Props) {
  const groups = useGroupStore((s) => s.groups);
  const setGroups = useGroupStore((s) => s.setGroups);

  useEffect(() => {
    const client = getIMClient();
    if (!client) return;
    client.getMyGroups().then((list) => setGroups(list)).catch(() => {});
  }, [setGroups]);

  const groupList = Object.values(groups);

  return (
    <div className="flex-1 overflow-y-auto">
      {groupList.length === 0 ? (
        <div className="text-center text-wechat-text-secondary text-sm mt-10 px-4">
          暂无群聊，使用 /create 命令创建
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
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-100 ${
        isActive ? 'bg-wechat-green/10' : 'hover:bg-gray-50'
      }`}
    >
      <div className="w-10 h-10 rounded-md bg-wechat-green text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
        {group.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-wechat-text truncate">{group.name}</span>
        </div>
        <span className="text-xs text-wechat-text-secondary">{group.memberCount} 人</span>
      </div>
    </div>
  );
}
