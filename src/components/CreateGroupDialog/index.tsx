import { useState, useEffect } from 'react';
import { getIMClient } from '@/hooks/useIMClient';
import { useFriendStore, type Friend } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string, name: string) => void;
  preSelectedFriend?: string; // 从当前聊天页带入的好友 ID
}

export function CreateGroupDialog({ open, onClose, onGroupCreated, preSelectedFriend }: Props) {
  const friends = useFriendStore((s) => s.friends);
  const addGroup = useGroupStore((s) => s.addGroup);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      const init = new Set<string>();
      if (preSelectedFriend) init.add(preSelectedFriend);
      setSelected(init);
      setGroupName('');
    }
  }, [open, preSelectedFriend]);

  if (!open) return null;

  const toggle = (userId: string) => {
    const next = new Set(selected);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelected(next);
  };

  const handleCreate = async () => {
    if (selected.size === 0) return;
    const client = getIMClient();
    if (!client) return;

    const names = Array.from(selected)
      .map((uid) => friends.find((f) => f.userId === uid)?.nickname || uid)
      .slice(0, 3);
    const name = groupName.trim() || names.join('、') + '的群聊';

    setCreating(true);
    try {
      const resp = await client.createGroup(name);
      addGroup(resp.group);
      // 逐个邀请好友入群
      for (const uid of selected) {
        try { await client.inviteToGroup(resp.group.groupId, uid); } catch { /* skip */ }
      }
      onGroupCreated(resp.group.groupId, name);
    } catch { /* ignore */ }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
         onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[min(360px,92vw)] max-h-[500px] flex flex-col"
           onClick={(e) => e.stopPropagation()}>
        {/* 标题 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium">发起群聊</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        {/* 群名输入 */}
        <div className="px-4 py-2">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="群聊名称（选填，默认取好友昵称拼接）"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-primary"
          />
        </div>

        {/* 好友列表 */}
        <div className="flex-1 overflow-y-auto px-2">
          {friends.length === 0 ? (
            <div className="text-center text-text-sub text-xs py-6">暂无好友</div>
          ) : (
            friends.map((f) => (
              <FriendCheckItem
                key={f.userId}
                friend={f}
                checked={selected.has(f.userId)}
                onToggle={() => toggle(f.userId)}
              />
            ))
          )}
        </div>

        {/* 底部操作 */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-text-sub">
            已选 {selected.size} 人
          </span>
          <button
            onClick={handleCreate}
            disabled={creating || selected.size === 0}
            className="px-4 py-1.5 text-sm rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {creating ? '创建中...' : '创建群聊'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendCheckItem({ friend, checked, onToggle }: {
  friend: Friend;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer transition-colors ${
        checked ? 'bg-primary/10' : 'hover:bg-gray-50'
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked ? 'bg-primary border-primary' : 'border-gray-300'
      }`}>
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0">
        {(friend.nickname || friend.userName).charAt(0).toUpperCase()}
      </div>
      <span className="text-sm text-text-main truncate flex-1">
        {friend.nickname || friend.userName}
      </span>
    </div>
  );
}
