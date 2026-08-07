import { useEffect, useState } from 'react';
import { getIMClient } from '@/hooks/useIMClient';
import { useGroupStore } from '@/stores/useGroupStore';
import type { GroupInfo } from '@/sdk/types';

interface Props {
  activeGroupId: string | null;
  onSelect: (groupId: string, name: string) => void;
}

export function GroupPanel({ activeGroupId, onSelect }: Props) {
  const groups = useGroupStore((s) => s.groups);
  const setGroups = useGroupStore((s) => s.setGroups);
  const addGroup = useGroupStore((s) => s.addGroup);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadGroups = () => {
    const client = getIMClient();
    if (!client) return;
    client.getMyGroups().then((list) => setGroups(list)).catch(() => {});
  };

  useEffect(() => { loadGroups(); }, [setGroups]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const client = getIMClient();
    if (!client) return;
    setCreating(true);
    try {
      const resp = await client.createGroup(newName.trim());
      addGroup(resp.group);
      setNewName('');
      setShowCreate(false);
    } catch { /* ignore */ }
    setCreating(false);
  };

  const groupList = Object.values(groups);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 创建群按钮 */}
      <div className="p-2 border-b border-gray-200">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-1.5 text-sm rounded bg-wechat-green text-white hover:bg-wechat-green-dark transition-colors"
        >
          + 创建群聊
        </button>
      </div>

      {/* 创建群弹窗 */}
      {showCreate && (
        <div className="absolute inset-0 bg-black/30 z-30 flex items-center justify-center"
             onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-lg shadow-xl w-[280px] p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium mb-3">创建群聊</h3>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="输入群名称"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-wechat-green"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setShowCreate(false)}
                className="px-3 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200">取消</button>
              <button onClick={handleCreate} disabled={creating || !newName.trim()}
                className="px-3 py-1 text-xs rounded bg-wechat-green text-white hover:bg-wechat-green-dark disabled:opacity-50">
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
      {groupList.length === 0 ? (
        <div className="text-center text-wechat-text-secondary text-sm mt-10 px-4">
          暂无群聊，点击上方按钮创建
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
