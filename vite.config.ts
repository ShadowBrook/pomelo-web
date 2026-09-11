import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'node:fs'

export default defineConfig(({ mode }) => {
  // 后端地址可由 .env.[mode] 的 VITE_API_TARGET 覆盖（默认 compose 的 TLS 端点）
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'https://localhost:8888';

  // WebSocket 代理目标：开发时前端连同源的 ws://<dev-server>/ws，
  // 由 Vite 代理到网关（wss + 自签名证书）。浏览器无需信任自签名证书。
  const wsTarget = env.VITE_WS_TARGET || 'wss://localhost:9001';

  // LiveKit 信令同源代理：/lk -> 本机 livekit 容器（7880）。
  // 手机等局域网设备经 https 页面连 wss://<dev-server>/lk，规避混合内容与自签名证书问题。
  const livekitTarget = env.VITE_LIVEKIT_TARGET || 'http://localhost:7880';

  // 开发自签 HTTPS：getUserMedia 在非安全上下文（http://局域网IP）不可用，
  // 手机测试必须 https。证书链：
  //   1) 优先 mkcert 产物（conf/tls/dev-server.*，带 localhost/局域网 IP SAN；
  //      其根 CA 可装进手机/电脑信任链，装完后所有证书警告永久消失，见 scripts 说明）
  //   2) 回退 gen-dev-cert.sh 的自签名对（仅浏览器点豁免可用，fetch 类请求可能被拒）
  const tlsDir = resolve(__dirname, '../pomelo/conf/tls');
  const pickTls = (name: string) => resolve(tlsDir, name);
  const httpsConf = existsSync(pickTls('dev-server.crt')) && existsSync(pickTls('dev-server.key'))
    ? { key: readFileSync(pickTls('dev-server.key')), cert: readFileSync(pickTls('dev-server.crt')) }
    : existsSync(pickTls('server.key')) && existsSync(pickTls('server.crt'))
      ? { key: readFileSync(pickTls('server.key')), cert: readFileSync(pickTls('server.crt')) }
      : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      // 监听所有网卡：局域网内手机可通过 https://<电脑IP>:5173 访问
      host: true,
      https: httpsConf,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // 自签名证书开发场景不校验
          secure: false,
        },
        // WebSocket 同源代理：浏览器连 ws(s)://<dev-server>/ws，Vite 转发到网关 wss 端点
        '/ws': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
          // 网关使用自签名证书
          secure: false,
        },
        // LiveKit 信令同源代理（音视频通话）：剥掉 /lk 前缀——
        // LiveKit 只识别 /rtc、/twirp 等路径，带前缀会 404（v1 RTC path not found）
        '/lk': {
          target: livekitTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/lk/, ''),
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
