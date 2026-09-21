import { useState } from 'react';
import { AvatarImg } from '@/components/CachedImg';
import { useFriendStore } from '@/stores/useFriendStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddFriendDialog({ open, onClose }: Props) {
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { searchResults, searchUsers, sendFriendRequest, loading } = useFriendStore();
  const user = useAuthStore((s) => s.user);

  if (!open) return null;

  const handleSearch = () => {
    if (keyword.trim()) {
      searchUsers(keyword.trim());
      setMessage(null);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;
    const result = await sendFriendRequest(user.userId, friendId);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[420px] max-h-[500px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-base font-medium text-text-main">添加好友</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入用户名或昵称搜索"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={!keyword.trim() || loading}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark disabled:opacity-50"
            >
              搜索
            </button>
          </div>
          {message && (
            <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {message.text}
            </p>
          )}
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">暂无搜索结果</p>
          ) : (
            searchResults.map((u) => (
              <div key={u.userId} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  <AvatarImg url={u.avatar} name={u.nickname} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-text-main">{u.nickname}</p>
                  <p className="text-xs text-gray-400">ID: {u.userName || u.userId}</p>
                </div>
                <button
                  onClick={() => handleAddFriend(u.userId)}
                  className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark"
                >
                  加好友
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
