import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCallStore } from './useCallStore';
import { useConversationStore } from './useConversationStore';
import { useFriendStore } from './useFriendStore';
import { CallEndReason, CallMediaType, type CallEvent } from '@/sdk/types';

const fakeClient = vi.hoisted(() => ({
  inviteCall: vi.fn(),
  acceptCall: vi.fn(),
  endCall: vi.fn(),
}));

vi.mock('@/hooks/useIMClient', () => ({
  getIMClient: () => fakeClient,
}));

// LiveKit 打桩：joinLiveKit 的动态 import 命中本桩，connect 立即成功
const connectSpy = vi.hoisted(() => vi.fn());
vi.mock('livekit-client', () => {
  class Room {
    on() {}
    async connect(url: string, token: string) {
      await connectSpy(url, token);
    }
    async disconnect() {}
    localParticipant = {
      setMicrophoneEnabled: vi.fn(),
      setCameraEnabled: vi.fn(),
    };
  }
  return {
    Room,
    RoomEvent: {
      TrackSubscribed: 'TrackSubscribed',
      TrackUnsubscribed: 'TrackUnsubscribed',
      LocalTrackPublished: 'LocalTrackPublished',
      LocalTrackUnpublished: 'LocalTrackUnpublished',
      Disconnected: 'Disconnected',
    },
    Track: { Source: { Camera: 'camera', Microphone: 'microphone' } },
  };
});

function seedConversation(peerId: string) {
  useConversationStore.setState((s) => ({
    conversations: {
      ...s.conversations,
      [peerId]: {
        peerId,
        type: 'c2c' as const,
        nickname: peerId,
        avatar: '',
        lastMessage: '',
        lastMessageTime: 0,
        unreadCount: 0,
      },
    },
  }));
}

function pushEvent(partial: Partial<CallEvent>): CallEvent {
  return {
    callId: 'call-1',
    event: 1,
    mediaType: CallMediaType.AUDIO,
    peerId: '200',
    peerUserName: '',
    peerNickname: '',
    reason: 0,
    room: '',
    token: '',
    wsUrl: '',
    ...partial,
  };
}

/**
 * 通话状态机：idle → outgoing/incoming → active → ended。
 * LiveKit 与 IMClient 均为打桩，只验证状态迁移、材料下发与清理路径。
 */
describe('useCallStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCallStore.getState().reset();
    useConversationStore.getState().clearAll();
    useFriendStore.setState({ friends: [{ userId: '200', userName: 'yz', nickname: '老 Y', avatar: 'http://a/200.png', online: true, friendedAt: 0 }] });
  });

  it('主叫：startCall 进入 outgoing 并拿到 callId', async () => {
    fakeClient.inviteCall.mockResolvedValue({ code: 0, message: 'success', callId: 'call-1' });

    await useCallStore.getState().startCall('200', '老 Y', CallMediaType.VIDEO);

    expect(fakeClient.inviteCall).toHaveBeenCalledWith('200', CallMediaType.VIDEO);
    const s = useCallStore.getState();
    expect(s.phase).toBe('outgoing');
    expect(s.callId).toBe('call-1');
    expect(s.mediaType).toBe(CallMediaType.VIDEO);
  });

  it('主叫：呼叫被拒（对方忙）→ 回到 idle 并不再保留 callId', async () => {
    fakeClient.inviteCall.mockRejectedValue(new Error('对方忙，请稍后再拨'));

    await useCallStore.getState().startCall('200', '老 Y', CallMediaType.AUDIO);

    const s = useCallStore.getState();
    expect(s.phase).toBe('idle');
    expect(s.callId).toBeNull();
  });

  it('被叫：ringing 推送 → incoming，展示名按 昵称>用户名>ID 取', async () => {
    await useCallStore.getState().onCallEvent(pushEvent({ event: 1, peerNickname: '老 Y' }));

    const s = useCallStore.getState();
    expect(s.phase).toBe('incoming');
    expect(s.callId).toBe('call-1');
    expect(s.peerName).toBe('老 Y');
  });

  it('被叫：非空闲时来电推送被忽略（双保险，服务端忙线为主）', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-mine', peerId: '300' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 1, callId: 'call-1' }));

    const s = useCallStore.getState();
    expect(s.phase).toBe('outgoing');
    expect(s.callId).toBe('call-mine');
  });

  it('主叫：accepted 推送 → active 并用下发材料连接 LiveKit', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({
      event: 2, room: 'call-1-abc', token: 'tk-caller', wsUrl: 'ws://lk:7880',
    }));

    const s = useCallStore.getState();
    expect(s.phase).toBe('active');
    expect(s.connectedAt).not.toBeNull();
    expect(connectSpy).toHaveBeenCalledWith('ws://lk:7880', 'tk-caller');
  });

  it('被叫：accept → 请求接听并进入 active', async () => {
    useCallStore.setState({ phase: 'incoming', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    fakeClient.acceptCall.mockResolvedValue({ code: 0, message: 'success', room: 'call-1-abc', token: 'tk-callee', wsUrl: 'ws://lk:7880' });

    await useCallStore.getState().accept();

    expect(fakeClient.acceptCall).toHaveBeenCalledWith('call-1');
    expect(useCallStore.getState().phase).toBe('active');
    expect(connectSpy).toHaveBeenCalledWith('ws://lk:7880', 'tk-callee');
  });

  it('被叫：reject → 发送 END(REJECT) 并回 idle', async () => {
    useCallStore.setState({ phase: 'incoming', callId: 'call-1', peerId: '200', peerName: '老 Y' });

    await useCallStore.getState().reject();

    expect(fakeClient.endCall).toHaveBeenCalledWith('call-1', CallEndReason.REJECT);
    expect(useCallStore.getState().phase).toBe('idle');
  });

  it('通话中用户主动挂断 → 发送 END(HANGUP) 并更新会话预览（含时长）', async () => {
    seedConversation('200');
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 2, room: 'r', token: 't', wsUrl: 'ws://lk' }));
    // 用户点挂断
    await useCallStore.getState().hangup();

    expect(fakeClient.endCall).toHaveBeenCalledWith('call-1', CallEndReason.HANGUP);
    expect(useCallStore.getState().phase).toBe('idle');
    const conv = useConversationStore.getState().conversations['200'];
    expect(conv.lastMessage).toMatch(/^\[语音通话\] \d+:\d{2}$/);
  });

  it('对端先挂断：ended 推送直接收尾，不再回发 END（服务端已知）', async () => {
    seedConversation('200');
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 2, room: 'r', token: 't', wsUrl: 'ws://lk' }));
    await useCallStore.getState().onCallEvent(pushEvent({ event: 3, reason: CallEndReason.HANGUP, room: 'r', token: 't', wsUrl: 'ws://lk' }));

    expect(useCallStore.getState().phase).toBe('idle');
    expect(fakeClient.endCall).not.toHaveBeenCalled();
    expect(useConversationStore.getState().conversations['200'].lastMessage).toMatch(/^\[语音通话\] \d+:\d{2}$/);
  });

  it('ended：callId 不匹配的过期事件被忽略', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 3, callId: 'call-stale', reason: CallEndReason.HANGUP }));

    expect(useCallStore.getState().phase).toBe('outgoing');
    expect(fakeClient.endCall).not.toHaveBeenCalled();
  });

  it('振铃阶段取消：预览标记未接听时不产生通话时长', async () => {
    seedConversation('200');
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y', mediaType: CallMediaType.AUDIO });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 3, reason: CallEndReason.CANCEL }));

    const conv = useConversationStore.getState().conversations['200'];
    expect(conv.lastMessage).toBe('[语音通话]');
  });
});
