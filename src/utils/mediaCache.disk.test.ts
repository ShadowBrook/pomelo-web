import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

/**
 * 媒体缓存磁盘层回归：头像/缩略图不该每次打开页面都重新下载。
 *
 * 缓存键是「origin + 路径」（剥掉预签名查询串），所以第二层必须落在 IndexedDB 上——
 * 内存层刷新就没了，而预签名 URL 每次请求都不同，浏览器 HTTP 缓存也命不中。
 */

const objectUrls: string[] = [];

// node 没有 createObjectURL：测试里用自增假地址替代（只用于断言返回了缓存地址）
const createObjectURL = vi.fn(() => {
  const url = `blob:test/${objectUrls.length + 1}`;
  objectUrls.push(url);
  return url;
});
const revokeObjectURL = vi.fn();

beforeEach(async () => {
  const { clearMemoryMediaCache } = await import('./mediaCache');
  clearMemoryMediaCache();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('媒体两级缓存', () => {
  it('首次访问走网络并写入 IndexedDB', async () => {
    const { stableMediaKey } = await import('./mediaCache');
    const { mediaGet } = await import('./idb');
    const png = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' });
    const fetchMock = vi.fn(async () => new Response(png));
    vi.stubGlobal('fetch', fetchMock);
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;

    const { loadCachedMedia } = await import('./mediaCache');
    const src = 'https://cdn.example.com/media/avatar/a1.png?sig=aaa';
    const url = await loadCachedMedia(src);
    expect(url).toMatch(/^blob:/);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const row = await mediaGet(stableMediaKey(src));
    expect(row?.size).toBe(4);
    expect(row?.type).toBe('image/png');
  });

  it('刷新页面后（内存清空）命中磁盘，不再请求网络', async () => {
    const png = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/png' });
    const fetchMock = vi.fn(async () => new Response(png));
    vi.stubGlobal('fetch', fetchMock);
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;

    const { loadCachedMedia, clearMemoryMediaCache } = await import('./mediaCache');
    // 预签名参数每次都不同：同一个对象路径，不同签名
    await loadCachedMedia('https://cdn.example.com/media/avatar/a2.png?sig=first');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clearMemoryMediaCache();
    const second = await loadCachedMedia('https://cdn.example.com/media/avatar/a2.png?sig=second');
    expect(second).toMatch(/^blob:/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('网络失败降级为原始地址，并短期记住失败不再重试', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;

    const { loadCachedMedia } = await import('./mediaCache');
    const src = 'https://cdn.example.com/media/avatar/a3.png?sig=1';
    // 并发请求同一个对象只打一次网络
    const [a, b] = await Promise.all([loadCachedMedia(src), loadCachedMedia(src)]);
    expect(a).toBe(src);
    expect(b).toBe(src);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // 失败被记住：紧接着的调用不再重试
    expect(await loadCachedMedia(src)).toBe(src);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('超过单条上限的媒体不落盘（大视频不值得占配额）', async () => {
    const { stableMediaKey } = await import('./mediaCache');
    const { mediaGet } = await import('./idb');
    const big = new Blob([new Uint8Array(9 * 1024 * 1024)], { type: 'video/mp4' });
    const fetchMock = vi.fn(async () => new Response(big));
    vi.stubGlobal('fetch', fetchMock);
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;

    const { loadCachedMedia } = await import('./mediaCache');
    const src = 'https://cdn.example.com/media/video/big.mp4?sig=1';
    await loadCachedMedia(src);
    expect(await mediaGet(stableMediaKey(src))).toBeUndefined();
  });

  it('LRU 淘汰按命中时间保留最近使用的条目', async () => {
    const { mediaPut, mediaTrim, mediaGet } = await import('./idb');
    // 先清空：淘汰按全库条目数算，别的用例留下的条目会影响计数
    await mediaTrim(0, 0);
    for (let i = 0; i < 4; i++) {
      await mediaPut({
        key: `k${i}`,
        blob: new Blob([new Uint8Array([i])]),
        size: 1,
        type: 'image/png',
        at: 1000 + i,
      });
    }
    await mediaTrim(2, 1024 * 1024);
    expect(await mediaGet('k0')).toBeUndefined();
    expect(await mediaGet('k1')).toBeUndefined();
    expect(await mediaGet('k2')).toBeDefined();
    expect(await mediaGet('k3')).toBeDefined();
  });
});
