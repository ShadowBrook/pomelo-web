import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 后端地址可由 .env.[mode] 的 VITE_API_TARGET 覆盖（默认 compose 的 TLS 端点）
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'https://localhost:8888';

  // WebSocket 代理目标：开发时前端连同源的 ws://<dev-server>/ws，
  // 由 Vite 代理到网关（wss + 自签名证书）。浏览器无需信任自签名证书。
  const wsTarget = env.VITE_WS_TARGET || 'wss://localhost:9001';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // 自签名证书开发场景不校验
          secure: false,
        },
        // WebSocket 同源代理：浏览器连 ws://<dev-server>/ws，Vite 转发到网关 wss 端点
        '/ws': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
          // 网关使用自签名证书
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              if (id.includes('react')) {
                return 'vendor';
              }
              if (id.includes('zustand')) {
                return 'state';
              }
            }
            return null;
          },
        },
      },
    },
  };
});
