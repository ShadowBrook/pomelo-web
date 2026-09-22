import { useEffect, useState } from 'react';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';
import { mediaGet, mediaPut, mediaTrim, mediaTouch, type StoredMedia } from '@/utils/idb';

/**
 * 预签名媒体缓存（头像/图片/视频封面/语音）。
 *
 * 服务端下发的地址是**预签名 URL**：签名参数每次请求都不同，浏览器按完整 URL 作缓存键
 * 会永不命中——每次刷新好友列表、每次重渲染都要重新下载，这就是头像加载慢的原因。
 *
 * 两级缓存：内存（blob URL，渲染零延迟）+ IndexedDB（blob，刷新页面后依然命中，
 * 离线也能显示历史图片）。缓存键统一是「origin + 路径」，换头像 = 换对象路径 = 新键。
 */

/** 内存上限：头像 + 缩略图，600 张足够覆盖常规会话规模 */
const CACHE_LIMIT = 600;
/** 失败短期缓存：避免同一张图在多次重渲染中反复重试 */
const FAIL_TTL_MS = 60_000;
/** 磁盘条目上限 */
const DISK_MAX_ENTRIES = 2000;
/** 磁盘总量上限：媒体是「重下载代价高」的数据，给足配额 */
const DISK_MAX_BYTES = 120 * 1024 * 1024;
/** 单条上限：超过就不落盘（大视频不值得占配额，也不该被一次次完整写盘） */
const DISK_ENTRY_MAX_BYTES = 8 * 1024 * 1024;

const blobCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const failedAt = new Map<string, number>();

/** 稳定缓存键：去掉预签名查询串（签名每次不同，带签名作键则永不命中） */
export function stableMediaKey(url: string): string {
  try {
    const base = typeof window !== 'undefined' ? window.location.href : undefined;
    const u = new URL(url, base);
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

/** 仅测试使用：清空内存层，用来验证磁盘层（IndexedDB）确实命中 */
export function clearMemoryMediaCache(): void {
  blobCache.clear();
  inflight.clear();
  failedAt.clear();
}

function toObjectUrl(key: string, blob: Blob): string {
  const objectUrl = URL.createObjectURL(blob);
  put(key, objectUrl);
  return objectUrl;
}

function persistToDisk(key: string, blob: Blob): void {
  if (blob.size <= 0 || blob.size > DISK_ENTRY_MAX_BYTES) return;
  const row: StoredMedia = {
    key,
    blob,
    size: blob.size,
    type: blob.type || 'application/octet-stream',
    at: Date.now(),
  };
  void mediaPut(row).then(() => mediaTrim(DISK_MAX_ENTRIES, DISK_MAX_BYTES));
}

/**
 * 取（并缓存）媒体的可显示地址。查找顺序：内存 → IndexedDB → 网络。
 * 并发调用同一对象只发一次网络请求；失败降级为原始 URL（仍能显示，只是不进缓存），
 * 并短期记住失败避免重试风暴。
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

  const task = (async () => {
    const row = await mediaGet(key).catch(() => undefined);
    if (row?.blob && row.blob.size > 0) {
      // 命中本地库：刷新 LRU 时间，页面刷新/离线后依然秒开
      void mediaTouch(key, Date.now());
      failedAt.delete(key);
      return toObjectUrl(key, row.blob);
    }
    const resp = await fetch(src, { credentials: 'omit' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    persistToDisk(key, blob);
    failedAt.delete(key);
    return toObjectUrl(key, blob);
  })()
    .catch(() => {
      // 失败降级：直接用原始 URL 显示（浏览器/代理可能仍可加载），并短期记住失败避免重试风暴
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
