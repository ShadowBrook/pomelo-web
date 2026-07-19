import { useConversationStore } from '@/stores/useConversationStore';

export function useUnreadCount() {
  const conversations = useConversationStore((state) => state.conversations);

  const totalUnread = Object.values(conversations).reduce(
    (sum, conv) => sum + conv.unreadCount,
    0,
  );

  return { totalUnread };
}
