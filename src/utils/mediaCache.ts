import { useEffect, useState } from 'react';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';

/**
 * 预签名媒体缓存（头像/图片/视频封面）。
 *
 * 服务端下发的地址是**预签名 URL**：签名参数每次请求都不同，浏览器按完整 URL 作缓存键
 * 会永不命中——每次刷新好友列表、每次重渲染都要重新下载，这就是头像加载慢的原因。
 *
 * 这里以「origin + 路径」为稳定键缓存 blob（内存 blob URL）：同一对象只下载一次，
 * 换头像 = 换对象路径 = 新键，自动拉新图。
 */

/** 内存上限：头像 + 缩略图，600 张足够覆盖常规会话规模 */
const CACHE_LIMIT = 600;
/** 失败短期缓存：避免同一张图在多次重渲染中反复重试 */
const FAIL_TTL_MS = 60_000;

const blobCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const failedAt = new Map<string, number>();

/** 稳定缓存键：去掉预签名查询串（签名每次不同，带签名作键则永不命中） */
export function stableMediaKey(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

function put(key: string, value: string): void {
  if (blobCache.size >= CACHE_LIMIT) {
    const oldest = blobCache.keys().next().value;
    if (oldest !== undefined) {
      const old = blobCache.get(oldest);
      blobCache.delete(oldest);
      if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
    }
  }
  blobCache.set(key, value);
}

/** 已缓存则同步返回（首帧即可用，无闪烁） */
export function peekCachedMedia(url: string): string | undefined {
  return blobCache.get(stableMediaKey(sameOriginMediaUrl(url)));
}

/**
 * 取（并缓存）媒体的可显示地址。并发调用同一对象只发一次请求；
 * 失败降级为原始 URL（仍能显示，只是不进缓存），并短期记住失败避免重试风暴。
 */
export function loadCachedMedia(url: string): Promise<string> {
  const src = sameOriginMediaUrl(url);
  const key = stableMediaKey(src);

  const hit = blobCache.get(key);
  if (hit) return Promise.resolve(hit);

  const failTs = failedAt.get(key);
  if (failTs !== undefined && Date.now() - failTs < FAIL_TTL_MS) {
    return Promise.resolve(src);
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = fetch(src, { credentials: 'omit' })
    .then((resp) => {
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      put(key, objectUrl);
      failedAt.delete(key);
      return objectUrl;
    })
    .catch(() => {
      // 失败降级：直接用原始 URL 显示（浏览器/代理可能仍可加载）
      failedAt.set(key, Date.now());
      return src;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, task);
  return task;
}

/**
 * 媒体地址 Hook：命中缓存立即返回；未命中时先返回 undefined（由调用方显示占位/首字母），
 * 后台拉取完成后自动切换到缓存地址。
 */
export function useCachedMediaUrl(url?: string | null): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(() =>
    url ? peekCachedMedia(url) : undefined,
  );

  useEffect(() => {
    if (!url) {
      setResolved(undefined);
      return;
    }
    const cached = peekCachedMedia(url);
    if (cached) {
      setResolved(cached);
      return;
    }
    setResolved(undefined);
    let alive = true;
    void loadCachedMedia(url).then((value) => {
      if (alive) setResolved(value);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  return resolved;
}
