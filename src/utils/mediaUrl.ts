/**
 * 对象存储 URL 的同源改写 —— **仅开发机生效**。
 *
 * 开发环境 publicEndpoint 是 http://localhost:9002，Safari 按混合内容规则禁直连，
 * Vite 的 /minio 代理（changeOrigin 回填签发 Host）保证 SigV4 校验通过。
 *
 * 生产构建不做任何改写：publicEndpoint 必须配置为浏览器可达的 https 地址
 * （demo 拓扑即 https://oss.pomelo.host，presigned URL 直连 oss 子域）。
 * 配置错误会显式失败（上传/图片不可用），而不是静默走兜底掩盖配置问题。
 */
export function sameOriginMediaUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }
  // 生产构建：信任服务端下发的 URL（要求 publicEndpoint 为 https 可达地址）
  if (!import.meta.env.DEV) {
    return url;
  }
  try {
    const u = new URL(url, window.location.href);
    if (u.origin === window.location.origin) {
      return url;
    }
    if (u.protocol !== 'http:' || window.location.protocol !== 'https:') {
      return url;
    }
    return `${window.location.origin}/minio${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}
