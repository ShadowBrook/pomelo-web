import { useEffect } from 'react';
import { useFriendStore } from '@/stores/useFriendStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  onChatWithFriend: (peerId: string, nickname: string, avatar: string) => void;
}

export function FriendsPanel({ onChatWithFriend }: Props) {
  const user = useAuthStore((s) => s.user);
  const { friends, pendingRequests, loadFriends, loadPendingRequests, acceptFriendRequest } = useFriendStore();

  useEffect(() => {
    if (user) {
      loadFriends(user.userId);
      loadPendingRequests(user.userId);
    }
  }, [user, loadFriends, loadPendingRequests]);

  const handleAccept = async (friendId: string) => {
    if (!user) return;
    const result = await acceptFriendRequest(user.userId, friendId);
    if (result.success) {
      // 重新加载好友列表
      loadFriends(user.userId);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 待处理申请 */}
      {pendingRequests.length > 0 && (
        <div className="border-b">
          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">好友申请</div>
          {pendingRequests.map((req) => (
            <div key={req.userId} className="flex items-center px-3 py-2 hover:bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs overflow-hidden">
                {req.avatar ? <img src={req.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : req.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="ml-2 flex-1 min-w-0">
                <p className="text-sm font-medium text-wechat-text truncate">{req.nickname}</p>
                <p className="text-xs text-gray-400">申请加你为好友</p>
              </div>
              <button
                onClick={() => handleAccept(req.userId)}
                className="px-3 py-1 text-xs bg-wechat-green text-white rounded hover:bg-wechat-green-dark"
              >
                接受
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 好友列表 */}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">好友 ({friends.length})</div>
      {friends.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">暂无好友</p>
      ) : (
        friends.map((friend) => (
          <div
            key={friend.userId}
            onClick={() => onChatWithFriend(friend.userId, friend.nickname, friend.avatar)}
            className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-200/50"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs overflow-hidden">
                {friend.avatar ? <img src={friend.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : friend.nickname.charAt(0).toUpperCase()}
              </div>
              {friend.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
              )}
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-sm font-medium text-wechat-text truncate">{friend.nickname}</p>
              <p className="text-xs text-gray-400">{friend.online ? '在线' : '离线'}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
