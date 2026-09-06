import { create } from 'zustand';

/** 主面板列宽（v9 复合窗左列） */
export const MAIN_PANEL_WIDTH = 300;

interface WindowState {
  /** 整个 IM 界面是否可见（聊天窗 ✕ = false，只留导航栏+背景） */
  imVisible: boolean;
  /** 复合窗全屏（参考 rb_main2） */
  fullscreen: boolean;
  /** 当前聊天窗指向的会话（null = 空态占位） */
  chatPeerId: string | null;

  openIM: () => void;
  hideIM: () => void;
  toggleFullscreen: () => void;
  openChat: (peerId: string) => void;
  closeChat: () => void;
  clearAll: () => void;
}

export const useWindowStore = create<WindowState>()((set) => ({
  imVisible: false,
  fullscreen: false,
  chatPeerId: null,

  openIM: () => set({ imVisible: true }),
  hideIM: () => set({ imVisible: false }),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  openChat: (peerId) => set({ chatPeerId: peerId, imVisible: true }),
  closeChat: () => set({ chatPeerId: null }),
  clearAll: () => set({ imVisible: false, fullscreen: false, chatPeerId: null }),
}));
