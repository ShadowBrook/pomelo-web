/**
 * 对象存储 URL 的同源改写。
 *
 * presigned URL 的 host 来自服务端 media.publicEndpoint（开发环境是 http://localhost:9002）。
 * https 页面直连 http 端点属于混合内容：Safari 会强制拦截（fetch 直接抛 Load failed，
 * <img> 也不渲染）；Chrome 只对 localhost 网开一面，局域网 IP 场景同样被拦。
 *
 * 改写为同源 /minio 代理路径后不再有混合内容问题；SigV4 签名校验的 Host 由
 * vite/nginx 代理回填为签发时的 publicEndpoint（changeOrigin），签名依然有效。
 * 端点本身是 https（生产配公网域名）时无需改写，原样返回。
 */
export function sameOriginMediaUrl(url: string): string {
  if (!url || typeof url !== 'string') {
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
