import { create } from 'zustand';
import { getIMClient } from '@/hooks/useIMClient';
import { CallEndReason, CallEvent, CallMediaType } from '@/sdk/types';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { toast } from '@/stores/useToastStore';
import { startIncomingRing, startOutgoingRing, stopRing, ensureAudioUnlocked } from '@/utils/ringtone';

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'active';

interface CallState {
  phase: CallPhase;
  callId: string | null;
  peerId: string;
  /** 展示名（昵称 > 用户名 > ID） */
  peerName: string;
  peerAvatar: string;
  mediaType: CallMediaType;
  /** LiveKit 入会三件套 */
  room: string;
  token: string;
  wsUrl: string;
  /** 接通时刻（计时长用） */
  connectedAt: number | null;
  micOn: boolean;
  camOn: boolean;
  /** 远端/本地摄像头 track（视频通话预览用，组件负责挂到 <video>） */
  remoteVideoTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;

  startCall: (peerId: string, peerName: string, mediaType: CallMediaType) => Promise<void>;
  /** SDK 的 callEvent 推送入口（useIMClient 里接线） */
  onCallEvent: (event: CallEvent) => Promise<void>;
  accept: () => Promise<void>;
  reject: () => Promise<void>;
  hangup: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleCam: () => Promise<void>;
  reset: () => void;
}

/** LiveKit Room 实例不进响应式状态（非序列化对象），模块级持有 */
let livekitRoom: import('livekit-client').Room | null = null;
/** 远端语音的播放元素（attach 产物，持引用防 GC；换轨时移除旧元素） */
let remoteAudioEl: HTMLAudioElement | null = null;

function idle(): Pick<
  CallState,
  'phase' | 'callId' | 'peerId' | 'peerName' | 'peerAvatar' | 'mediaType' | 'room' | 'token' | 'wsUrl' | 'connectedAt' | 'micOn' | 'camOn' | 'remoteVideoTrack' | 'localVideoTrack'
> {
  return {
    phase: 'idle',
    callId: null,
    peerId: '',
    peerName: '',
    peerAvatar: '',
    mediaType: CallMediaType.AUDIO,
    room: '',
    token: '',
    wsUrl: '',
    connectedAt: null,
    micOn: true,
    camOn: true,
    remoteVideoTrack: null,
    localVideoTrack: null,
  };
}

function displayEndText(reason: number): string {
  switch (reason) {
    case CallEndReason.CANCEL: return '对方已取消';
    case CallEndReason.REJECT: return '对方已拒绝';
    case CallEndReason.HANGUP: return '通话已结束';
    case CallEndReason.BUSY: return '对方忙';
    case CallEndReason.TIMEOUT: return '无人接听';
    case CallEndReason.PEER_DROP: return '连接中断';
    default: return '通话已结束';
  }
}

export const useCallStore = create<CallState>()(() => ({
  ...idle(),

  /** 主叫入口（聊天窗头部按钮） */
  startCall: async (peerId, peerName, mediaType) => {
    ensureAudioUnlocked();
    const client = getIMClient();
    if (!client) {
      toast('连接未就绪，请稍后再试');
      return;
    }
    useCallStore.setState({ phase: 'outgoing', peerId, peerName, mediaType, callId: null });
    startOutgoingRing();
    try {
      const resp = await client.inviteCall(peerId, mediaType);
      // 振铃期间可能已被 end（极少）：仅在仍是同一通 outgoing 时落 callId
      const cur = useCallStore.getState();
      if (cur.phase === 'outgoing' && cur.peerId === peerId) {
        useCallStore.setState({ callId: resp.callId });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '呼叫失败';
      stopRing();
      useCallStore.setState(idle());
      toast(msg);
    }
  },

  /** S→C 通话事件（SDK 分发） */
  onCallEvent: async (event) => {
    const s = useCallStore.getState();
    // 只处理当前这一通的推送：callId 不匹配视为过期事件
    if (s.callId && event.callId !== s.callId && s.phase !== 'incoming') {
      return;
    }

    if (event.event === 1) {
      // 来电：仅空闲时可入（忙线已被服务端挡掉，这里是双保险）
      if (s.phase !== 'idle') return;
      const friend = useFriendStore.getState().friends.find((f) => f.userId === event.peerId);
      useCallStore.setState({
        phase: 'incoming',
        callId: event.callId,
        peerId: event.peerId,
        peerName: event.peerNickname || event.peerUserName || friend?.nickname || event.peerId,
        peerAvatar: friend?.avatar || '',
        mediaType: event.mediaType,
      });
      startIncomingRing();
      return;
    }

    if (event.event === 2) {
      // 对方接听（我是主叫）：拿主叫入会材料进房
      if (s.phase !== 'outgoing' || event.callId !== s.callId) return;
      stopRing();
      useCallStore.setState({
        phase: 'active',
        room: event.room,
        token: event.token,
        wsUrl: event.wsUrl,
        connectedAt: Date.now(),
      });
      await joinLiveKit();
      return;
    }

    if (event.event === 3) {
      if (event.callId !== s.callId) return;
      const endedText = displayEndText(event.reason);
      stopRing();
      await leaveLiveKit();
      updateConversationPreview(s, event.reason);
      useCallStore.setState(idle());
      // 通话有实质时长才提示；振铃阶段的取消/超时静默回落
      if (s.connectedAt) {
        toast(endedText);
      }
    }
  },

  /** 被叫接听：resp 携带被叫入会材料 */
  accept: async () => {
    const s = useCallStore.getState();
    if (s.phase !== 'incoming' || !s.callId) return;
    stopRing();
    ensureAudioUnlocked();
    try {
      const client = getIMClient();
      if (!client) throw new Error('连接未就绪');
      const resp = await client.acceptCall(s.callId);
      useCallStore.setState({
        phase: 'active',
        room: resp.room,
        token: resp.token,
        wsUrl: resp.wsUrl,
        connectedAt: Date.now(),
      });
      await joinLiveKit();
    } catch (e) {
      toast(e instanceof Error ? e.message : '接听失败');
      useCallStore.setState(idle());
    }
  },

  reject: async () => {
    const s = useCallStore.getState();
    stopRing();
    useCallStore.setState(idle());
    if (s.callId) {
      try {
        await getIMClient()?.endCall(s.callId, CallEndReason.REJECT);
      } catch {
        // 对端会经服务端收尾得知，本地忽略失败
      }
    }
  },

  hangup: async () => {
    const s = useCallStore.getState();
    stopRing();
    await leaveLiveKit();
    updateConversationPreview(s, CallEndReason.HANGUP);
    useCallStore.setState(idle());
    if (s.callId) {
      try {
        await getIMClient()?.endCall(s.callId, CallEndReason.HANGUP);
      } catch {
        // 服务端有超时/webhook 兜底
      }
    }
  },

  toggleMic: async () => {
    const s = useCallStore.getState();
    if (!livekitRoom) return;
    const next = !s.micOn;
    try {
      await livekitRoom.localParticipant.setMicrophoneEnabled(next);
      useCallStore.setState({ micOn: next });
    } catch (e) {
      toast(e instanceof Error ? e.message : '麦克风操作失败');
    }
  },

  toggleCam: async () => {
    const s = useCallStore.getState();
    if (!livekitRoom) return;
    const next = !s.camOn;
    try {
      await livekitRoom.localParticipant.setCameraEnabled(next);
      useCallStore.setState({ camOn: next });
    } catch (e) {
      toast(e instanceof Error ? e.message : '摄像头操作失败');
    }
  },

  reset: () => {
    void leaveLiveKit();
    stopRing();
    useCallStore.setState(idle());
  },
}));

// ------------------------------------------------------------------
// LiveKit 房间
// ------------------------------------------------------------------

async function joinLiveKit(): Promise<void> {
  const { room, token, wsUrl, mediaType } = useCallStore.getState();
  if (!room || !token || !wsUrl) return;
  try {
    const { Room, RoomEvent, Track } = await import('livekit-client');
    await leaveLiveKit();
    const lk = new Room({ adaptiveStream: true, dynacast: true });
    livekitRoom = lk;

    lk.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === 'video') {
        useCallStore.setState({ remoteVideoTrack: track.mediaStreamTrack });
      } else if (track.kind === 'audio') {
        // 远端语音：attach 产出 <audio> 并播放；持引用防 GC，换轨时移除旧元素
        remoteAudioEl?.remove();
        const el = track.attach();
        el.autoplay = true;
        el.play?.().catch(() => { /* 自动播放被拦时保持静默，用户点界面任意处即解锁 */ });
        remoteAudioEl = el;
      }
    });
    lk.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach();
      if (track.kind === 'video') {
        useCallStore.setState({ remoteVideoTrack: null });
      }
    });
    lk.on(RoomEvent.LocalTrackPublished, (pub) => {
      if (pub.source === Track.Source.Camera && pub.track?.mediaStreamTrack) {
        useCallStore.setState({ localVideoTrack: pub.track.mediaStreamTrack });
      }
    });
    lk.on(RoomEvent.LocalTrackUnpublished, (pub) => {
      if (pub.source === Track.Source.Camera) {
        useCallStore.setState({ localVideoTrack: null });
      }
    });
    lk.on(RoomEvent.Disconnected, () => {
      // 对方关闭房间/网络崩溃：由服务端 ended 推送走正常收尾，这里只做兜底清引用
      if (livekitRoom === lk) {
        livekitRoom = null;
      }
    });

    await lk.connect(wsUrl, token);

    // 关键：发布本端媒体。livekit-client 不会自动推流，不调 enable 则整通无声/无画面
    try {
      await lk.localParticipant.setMicrophoneEnabled(true);
      useCallStore.setState({ micOn: true });
    } catch {
      useCallStore.setState({ micOn: false });
      toast('麦克风不可用，请检查浏览器权限');
    }
    if (mediaType === CallMediaType.VIDEO) {
      try {
        await lk.localParticipant.setCameraEnabled(true);
        useCallStore.setState({ camOn: true });
      } catch {
        useCallStore.setState({ camOn: false });
        toast('摄像头不可用，请检查浏览器权限');
      }
    }
  } catch (e) {
    toast(e instanceof Error ? `通话连接失败: ${e.message}` : '通话连接失败');
    // 进房失败即整通结束（对端会经服务端超时/信令收尾）
    useCallStore.setState(idle());
  }
}

async function leaveLiveKit(): Promise<void> {
  const lk = livekitRoom;
  livekitRoom = null;
  if (lk) {
    try {
      // 先停本端轨道（关掉系统摄像头/麦克风指示灯），再断开
      lk.localParticipant.trackPublications.forEach((pub) => {
        pub.track?.mediaStreamTrack?.stop();
      });
      await lk.disconnect();
    } catch {
      // 断开失败无需处理
    }
  }
  remoteAudioEl?.remove();
  remoteAudioEl = null;
}

/** 通话结束后更新会话列表预览（本地生成，Phase 1 决议：通话记录不走消息通道） */
function updateConversationPreview(s: CallState, reason: number): void {
  if (!s.peerId) return;
  const label = s.mediaType === CallMediaType.VIDEO ? '[视频通话]' : '[语音通话]';
  let suffix = '';
  if (s.connectedAt) {
    const total = Math.max(1, Math.round((Date.now() - s.connectedAt) / 1000));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    suffix = ` ${m}:${String(sec).padStart(2, '0')}`;
  } else if (reason === CallEndReason.TIMEOUT) {
    suffix = ' 未接听';
  }
  useConversationStore.setState((state) => {
    const conv = state.conversations[s.peerId];
    if (!conv) return state;
    return {
      conversations: {
        ...state.conversations,
        [s.peerId]: { ...conv, lastMessage: `${label}${suffix}`, lastMessageTime: Date.now() },
      },
    };
  });
}
