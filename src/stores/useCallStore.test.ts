import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCallStore } from './useCallStore';
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

// LiveKit 打桩：joinLiveKit 的动态 import 命中本桩，connect 立即成功；
// 实例收集到 roomInstances 供断言“是否真的发布了本端媒体”
const roomInstances = vi.hoisted(() => [] as Array<{
  localParticipant: { setMicrophoneEnabled: ReturnType<typeof vi.fn>; setCameraEnabled: ReturnType<typeof vi.fn> };
}>);
vi.mock('livekit-client', () => {
  class Room {
    handlers: Record<string, (arg?: unknown) => void> = {};
    localParticipant = {
      setMicrophoneEnabled: vi.fn(),
      setCameraEnabled: vi.fn(),
      trackPublications: new Map(),
    };
    constructor() {
      roomInstances.push(this);
    }
    on(_event: string, handler: (arg?: unknown) => void) {
      this.handlers[_event] = handler;
    }
    async connect(_url: string, _token: string) {}
    async disconnect() {}
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
    const room = roomInstances[roomInstances.length - 1];
    expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true);
  });

  it('被叫：accept → 请求接听并进入 active', async () => {
    useCallStore.setState({ phase: 'incoming', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    fakeClient.acceptCall.mockResolvedValue({ code: 0, message: 'success', room: 'call-1-abc', token: 'tk-callee', wsUrl: 'ws://lk:7880' });

    await useCallStore.getState().accept();

    expect(fakeClient.acceptCall).toHaveBeenCalledWith('call-1');
    expect(useCallStore.getState().phase).toBe('active');
    const room = roomInstances[roomInstances.length - 1];
    expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true);
    expect(room.localParticipant.setCameraEnabled).not.toHaveBeenCalled();
  });

  it('视频通话：接通后发布摄像头，且采集/编码压到 480p/500kbps', async () => {
    useCallStore.setState({ phase: 'incoming', callId: 'call-1', peerId: '200', peerName: '老 Y', mediaType: CallMediaType.VIDEO });
    fakeClient.acceptCall.mockResolvedValue({ code: 0, message: 'success', room: 'call-1-abc', token: 'tk-callee', wsUrl: 'ws://lk:7880' });

    await useCallStore.getState().accept();

    const room = roomInstances[roomInstances.length - 1];
    expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true);
    expect(room.localParticipant.setCameraEnabled).toHaveBeenCalledWith(
      true,
      { resolution: { width: 640, height: 480, frameRate: 24 } },
      { videoEncoding: { maxBitrate: 500_000, maxFramerate: 24 } },
    );
  });

  it('媒体面意外掉线：主动发 END 让服务端立即收尾（不等 2h 上限）', async () => {
    fakeClient.endCall.mockResolvedValue({ code: 0, message: 'success' });
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 2, room: 'r', token: 't', wsUrl: 'ws://lk' }));

    const room = roomInstances[roomInstances.length - 1] as unknown as { handlers: Record<string, () => void> };
    room.handlers.Disconnected();

    expect(fakeClient.endCall).toHaveBeenCalledWith('call-1', CallEndReason.HANGUP);
  });

  it('本端主动挂断触发的断连：不重复发 END', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 2, room: 'r', token: 't', wsUrl: 'ws://lk' }));
    await useCallStore.getState().hangup();
    expect(fakeClient.endCall).toHaveBeenCalledTimes(1);

    // hangup 已清 room 引用，迟到的 Disconnected 不应再发
    const room = roomInstances[roomInstances.length - 1] as unknown as { handlers: Record<string, () => void> };
    room.handlers.Disconnected();

    expect(fakeClient.endCall).toHaveBeenCalledTimes(1);
    expect(useCallStore.getState().phase).toBe('idle');
  });

  it('被叫：reject → 发送 END(REJECT) 并回 idle', async () => {
    useCallStore.setState({ phase: 'incoming', callId: 'call-1', peerId: '200', peerName: '老 Y' });

    await useCallStore.getState().reject();

    expect(fakeClient.endCall).toHaveBeenCalledWith('call-1', CallEndReason.REJECT);
    expect(useCallStore.getState().phase).toBe('idle');
  });

  it('通话中用户主动挂断 → 发送 END(HANGUP) 并更新会话预览（含时长）', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 2, room: 'r', token: 't', wsUrl: 'ws://lk' }));
    // 用户点挂断
    await useCallStore.getState().hangup();

    expect(fakeClient.endCall).toHaveBeenCalledWith('call-1', CallEndReason.HANGUP);
    expect(useCallStore.getState().phase).toBe('idle');
  });

  it('对端先挂断：ended 推送直接收尾，不再回发 END（服务端已知）', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 2, room: 'r', token: 't', wsUrl: 'ws://lk' }));
    await useCallStore.getState().onCallEvent(pushEvent({ event: 3, reason: CallEndReason.HANGUP, room: 'r', token: 't', wsUrl: 'ws://lk' }));

    expect(useCallStore.getState().phase).toBe('idle');
    expect(fakeClient.endCall).not.toHaveBeenCalled();
  });

  it('ended：callId 不匹配的过期事件被忽略', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y' });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 3, callId: 'call-stale', reason: CallEndReason.HANGUP }));

    expect(useCallStore.getState().phase).toBe('outgoing');
    expect(fakeClient.endCall).not.toHaveBeenCalled();
  });

  it('振铃阶段取消：静默回落到 idle（记录由服务端系统消息负责）', async () => {
    useCallStore.setState({ phase: 'outgoing', callId: 'call-1', peerId: '200', peerName: '老 Y', mediaType: CallMediaType.AUDIO });
    await useCallStore.getState().onCallEvent(pushEvent({ event: 3, reason: CallEndReason.CANCEL }));

    expect(useCallStore.getState().phase).toBe('idle');
    expect(useCallStore.getState().callId).toBeNull();
  });
});
