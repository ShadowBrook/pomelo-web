/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebSocket 网关地址（不设置时按页面协议派生 wss/ws + 当前主机 + 9001） */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
