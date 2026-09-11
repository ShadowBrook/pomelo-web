import { create } from 'zustand';

/** 主面板列宽（v9 复合窗左列） */
export const MAIN_PANEL_WIDTH = 300;

interface WindowState {
  /** 当前聊天窗指向的会话（null = 空态占位） */
  chatPeerId: string | null;

  openChat: (peerId: string) => void;
  closeChat: () => void;
  clearAll: () => void;
}

export const useWindowStore = create<WindowState>()((set) => ({
  chatPeerId: null,

  openChat: (peerId) => set({ chatPeerId: peerId }),
  closeChat: () => set({ chatPeerId: null }),
  clearAll: () => set({ chatPeerId: null }),
}));
