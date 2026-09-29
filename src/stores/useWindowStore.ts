import { create } from 'zustand';

interface WindowState {
  /** 当前聊天窗指向的会话（null = 空态占位） */
  chatPeerId: string | null;

  /** 移动端（<768px）是否正显示聊天窗：false 显示会话列表，true 显示聊天窗；桌面端忽略 */
  mobileChatOpen: boolean;

  openChat: (peerId: string) => void;
  closeChat: () => void;
  openMobileChat: () => void;
  closeMobileChat: () => void;
  clearAll: () => void;
}

export const useWindowStore = create<WindowState>()((set) => ({
  chatPeerId: null,
  mobileChatOpen: false,

  openChat: (peerId) => set({ chatPeerId: peerId }),
  closeChat: () => set({ chatPeerId: null }),
  openMobileChat: () => set({ mobileChatOpen: true }),
  closeMobileChat: () => set({ mobileChatOpen: false }),
  clearAll: () => set({ chatPeerId: null, mobileChatOpen: false }),
}));
