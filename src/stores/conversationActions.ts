import { useConversationStore } from './useConversationStore';
import { useWindowStore } from './useWindowStore';

/**
 * 打开会话：右侧聊天窗的目标与左侧列表的选中态必须一起切。
 * <p>
 * 两者分属不同 store（`chatPeerId` / `activePeerId`），只切一个就会出现
 * "右侧已经显示这个会话、左侧那一行却没有高亮"。
 */
export function openConversation(peerId: string): void {
  useConversationStore.getState().setActivePeer(peerId);
  useWindowStore.getState().openChat(peerId);
  useWindowStore.getState().openMobileChat();
}

/**
 * 进入工作台：默认打开最近一个会话。
 * <p>
 * 会话列表会从 localStorage 恢复，但 `activePeerId` 不持久化
 * （见 useConversationStore 的 partialize），登录/刷新后必须显式补上选中态，
 * 否则默认打开的那个会话在列表里没有高亮。
 */
export function openMostRecentConversation(): void {
  const sorted = useConversationStore.getState().getSortedList();
  if (sorted.length > 0) {
    // 登录/刷新入口只补选中态与聊天窗目标，不置 mobileChatOpen——
    // 手机端落地页应是会话列表，聊天窗等用户点击时再进。
    useConversationStore.getState().setActivePeer(sorted[0]);
    useWindowStore.getState().openChat(sorted[0]);
  }
}
