/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebSocket 网关地址（不设置时按页面协议派生 wss/ws + 当前主机 + 9001） */
  readonly VITE_WS_URL?: string;
  /**
   * 备案号（选填，如「皖ICP备2026032119号」）：非空时显示在登录页底部并跳转工信部
   * 备案系统。值不入库——构建期由 .env.local 或命令行注入，见 .env.example。
   */
  readonly VITE_ICP_BEIAN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
