import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MsgType } from '@/sdk/types';
import type { ChatMessage } from './useChatStore';
import { useChatStore } from './useChatStore';

/**
 * 媒体消息签名 URL 补齐回归：
 * 发送方本地乐观副本的 content 只含对象 key（url 由服务端读侧注入），
 * 若不在发送确认/历史加载时补齐，本地 blob 预览失效后播放器只剩空地址。
 */
const { fakeClient } = vi.hoisted(() => ({
  fakeClient: {
    pullHistory: vi.fn(),
    pullGroupMessages: vi.fn(),
    requestUpload: vi.fn(),
    putFileToPresignedUrl: vi.fn(),
  },
}));

vi.mock('@/hooks/useIMClient', () => ({ getIMClient: () => fakeClient }));

const SIGNED = JSON.stringify({
  key: 'voice/a.webm', duration: 11000,
  url: 'http://localhost:9002/pomelo-media/voice/a.webm?sig=1',
});

describe('媒体消息签名 URL 补齐', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: {}, hasMoreHistory: {}, loadingHistory: {} });
    vi.clearAllMocks();
  });

  it('发送确认后自动拉最新一页，把签名 url 补进本地副本', async () => {
    fakeClient.requestUpload.mockResolvedValue({ presignedUrl: 'http://put', objectKey: 'voice/a.webm' });
    fakeClient.putFileToPresignedUrl.mockResolvedValue(undefined);
    fakeClient.pullHistory.mockResolvedValue({
      messages: [{
        id: 'server-1', senderId: 'me', recipientId: 'peer-1', msgType: MsgType.VOICE,
        content: SIGNED, createdAt: Date.now(), seq: 1,
      }],
      hasMore: false,
    });

    const file = new File([new Uint8Array(16)], 'voice.webm', { type: 'audio/webm' });
    useChatStore.getState().sendMedia(
      'peer-1', { msgType: MsgType.VOICE, file, duration: 11000 }, () => 'local-1',
    );
    await vi.waitFor(() => expect(useChatStore.getState().messages['peer-1']).toHaveLength(1));
    // 乐观副本此时只有 key，没有 url（这正是播放器拿不到地址的原因）
    expect(useChatStore.getState().messages['peer-1'][0].content).not.toContain('"url"');

    useChatStore.getState().onStatusChange({
      id: 'local-1', status: 'sent', seq: 1, serverMessageId: 'server-1',
    });

    await vi.waitFor(() => {
      expect(useChatStore.getState().messages['peer-1'][0].content).toContain('"url"');
    });
    // 本地发送状态不被刷新覆盖
    expect(useChatStore.getState().messages['peer-1'][0].status).toBe('sent');
    expect(useChatStore.getState().messages['peer-1'][0].id).toBe('server-1');
  });

  it('滚动加载更早历史时，本地副本的签名 url 被补齐', async () => {
    const local: ChatMessage = {
      id: 'server-2', senderId: '__self__', recipientId: 'peer-1', msgType: MsgType.VOICE,
      content: JSON.stringify({ key: 'voice/b.webm', duration: 8000 }),
      status: 'sent', timestamp: 1000,
    };
    useChatStore.setState({ messages: { 'peer-1': [local] } });
    fakeClient.pullHistory.mockResolvedValue({
      messages: [{
        id: 'server-2', senderId: 'me', recipientId: 'peer-1', msgType: MsgType.VOICE,
        content: JSON.stringify({ key: 'voice/b.webm', duration: 8000, url: 'http://localhost:9002/voice/b.webm?sig=2' }),
        createdAt: 1000, seq: 2,
      }],
      hasMore: true,
    });

    await useChatStore.getState().loadMoreHistory('peer-1', 'c2c');

    const msgs = useChatStore.getState().messages['peer-1'];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toContain('sig=2');
  });

  it('纯文本消息不触发 URL 刷新', () => {
    useChatStore.getState().sendText('peer-1', 'hi', undefined, () => 'local-2');
    useChatStore.getState().onStatusChange({
      id: 'local-2', status: 'sent', seq: 1, serverMessageId: 'server-3',
    });

    expect(fakeClient.pullHistory).not.toHaveBeenCalled();
  });
});
