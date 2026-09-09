import { create } from 'zustand';
import { ConnectionState } from '@/sdk/types';

interface ConnState {
  state: ConnectionState;
  reconnectFn: (() => void) | null;
  logoutFn: (() => void) | null;
  set: (s: ConnectionState) => void;
  setReconnect: (fn: (() => void) | null) => void;
  setLogout: (fn: (() => void) | null) => void;
  requestReconnect: () => void;
  requestLogout: () => void;
}

export const useConnStore = create<ConnState>()((set, get) => ({
  state: 'disconnected',
  reconnectFn: null,
  logoutFn: null,
  set: (state) => set({ state }),
  setReconnect: (reconnectFn) => set({ reconnectFn }),
  setLogout: (logoutFn) => set({ logoutFn }),
  requestReconnect: () => get().reconnectFn?.(),
  requestLogout: () => get().logoutFn?.(),
}));
