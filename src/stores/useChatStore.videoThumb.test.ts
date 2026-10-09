import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MsgType } from '@/sdk/types';
import { useChatStore } from './useChatStore';

/**
 * 视频封面本地直显回归：
 * 发送方本地副本的 content 只含对象 key，签名 thumbUrl 要等服务端读侧注入；
 * 部分浏览器（iOS Safari / Via 等 WebView）不为 <video preload=metadata> 解码首帧，
 * 所以抓帧成功后必须立即把本地封面挂上占位气泡，失败才降级为无封面。
 */
const { fakeClient, captureVideoPoster } = vi.hoisted(() => ({
  fakeClient: {
    requestUpload: vi.fn(),
    putFileToPresignedUrl: vi.fn(),
  },
  captureVideoPoster: vi.fn(),
}));

vi.mock('@/hooks/useIMClient', () => ({ getIMClient: () => fakeClient }));
vi.mock('@/sdk/media', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/sdk/media')>()),
  captureVideoPoster,
}));

describe('发送视频时本地封面挂到占位气泡', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: {}, hasMoreHistory: {}, loadingHistory: {} });
    vi.clearAllMocks();
  });

  it('抓帧成功后占位气泡立即带上 localThumbUrl，发送后保留', async () => {
    captureVideoPoster.mockResolvedValue({ blob: new Blob(['p'], { type: 'image/jpeg' }), durationMs: 5000 });
    fakeClient.requestUpload.mockResolvedValue({ presignedUrl: 'http://put', objectKey: 'video/a.mp4' });
    fakeClient.putFileToPresignedUrl.mockResolvedValue(undefined);

    const file = new File([new Uint8Array(16)], 'a.mp4', { type: 'video/mp4' });
    useChatStore.getState().sendMedia('peer-1', { msgType: MsgType.VIDEO, file }, () => 'local-1');

    await vi.waitFor(() => {
      expect(useChatStore.getState().messages['peer-1']?.[0]?.localThumbUrl).toMatch(/^blob:/);
    });
    // 占位换成真实消息后封面仍在：签名 thumbUrl 未就绪前这是唯一封面
    await vi.waitFor(() => expect(useChatStore.getState().messages['peer-1'][0].id).toBe('local-1'));
    expect(useChatStore.getState().messages['peer-1'][0].localThumbUrl).toMatch(/^blob:/);
    expect(useChatStore.getState().messages['peer-1'][0].content).toContain('"thumb"');
  });

  it('抓帧失败降级为无封面，不阻断发送', async () => {
    captureVideoPoster.mockRejectedValue(new Error('no canvas'));
    fakeClient.requestUpload.mockResolvedValue({ presignedUrl: 'http://put', objectKey: 'video/b.mp4' });
    fakeClient.putFileToPresignedUrl.mockResolvedValue(undefined);

    const file = new File([new Uint8Array(16)], 'b.mp4', { type: 'video/mp4' });
    useChatStore.getState().sendMedia('peer-1', { msgType: MsgType.VIDEO, file }, () => 'local-2');

    await vi.waitFor(() => expect(useChatStore.getState().messages['peer-1'][0].id).toBe('local-2'));
    expect(useChatStore.getState().messages['peer-1'][0].localThumbUrl).toBeUndefined();
    expect(useChatStore.getState().messages['peer-1'][0].content).not.toContain('"thumb"');
  });
});
