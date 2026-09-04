import { create } from 'zustand';

export type WindowKind = 'main' | 'chat';

export interface WinInfo {
  id: string;
  kind: WindowKind;
  peerId: string | null;
  pos: { x: number; y: number };
  zIndex: number;
  fullscreen: boolean;
}

export const MAIN_WINDOW_ID = 'main';
export const chatWindowId = (peerId: string) => `chat:${peerId}`;

interface WindowState {
  windows: WinInfo[];
  topZ: number;
  openMain: () => void;
  openChat: (peerId: string) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, pos: { x: number; y: number }) => void;
  toggleFullscreen: (id: string) => void;
  clearAll: () => void;
}

export const useWindowStore = create<WindowState>()((set, get) => ({
  windows: [],
  topZ: 1,

  openMain: () =>
    set((s) => {
      if (s.windows.some((w) => w.id === MAIN_WINDOW_ID)) return s;
      return {
        windows: [
          ...s.windows,
          { id: MAIN_WINDOW_ID, kind: 'main' as const, peerId: null, pos: { x: 140, y: 100 }, zIndex: s.topZ + 1, fullscreen: false },
        ],
        topZ: s.topZ + 1,
      };
    }),

  openChat: (peerId) => {
    const id = chatWindowId(peerId);
    if (get().windows.some((w) => w.id === id)) {
      get().focus(id);
      return;
    }
    set((s) => {
      const n = s.windows.filter((w) => w.kind === 'chat').length;
      return {
        windows: [
          ...s.windows,
          {
            id,
            kind: 'chat' as const,
            peerId,
            pos: { x: 200 + (n % 6) * 28, y: 120 + (n % 6) * 24 },
            zIndex: s.topZ + 1,
            fullscreen: false,
          },
        ],
        topZ: s.topZ + 1,
      };
    });
  },

  close: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focus: (id) =>
    set((s) => {
      const win = s.windows.find((w) => w.id === id);
      if (!win || win.zIndex === s.topZ) return s;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: s.topZ + 1 } : w)),
        topZ: s.topZ + 1,
      };
    }),

  move: (id, pos) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, pos } : w)) })),

  toggleFullscreen: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, fullscreen: !w.fullscreen } : w)),
    })),

  clearAll: () => set({ windows: [], topZ: 1 }),
}));
