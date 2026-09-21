import { create } from 'zustand';
import { getIMClient } from '@/hooks/useIMClient';
import { CallEndReason, CallEvent, CallMediaType } from '@/sdk/types';
import { useFriendStore } from '@/stores/useFriendStore';
import { toast } from '@/stores/useToastStore';
import { startIncomingRing, startOutgoingRing, stopRing, ensureAudioUnlocked } from '@/utils/ringtone';

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'active';

/** 通话网格里的一个远端参与方（id = LiveKit identity = userId） */
export interface CallPeer {
  id: string;
  /** 展示名（昵称 > 用户名 > ID），渲染时允许组件层再兜底 */
  name: string;
  /** 该参与方当前发布的摄像头轨（语音通话/未开摄像头为 null） */
  video: MediaStreamTrack | null;
}

interface CallState {
  phase: CallPhase;
  callId: string | null;
  peerId: string;
  /** 展示名（昵称 > 用户名 > ID） */
  peerName: string;
  peerAvatar: string;
  mediaType: CallMediaType;
  /** 群聊通话标记（决定浮层文案与多人网格布局） */
  isGroupCall: boolean;
  /** 服务端告知的参与方总数（含主叫，振铃时下发；群聊人数展示用） */
  participantCount: number;
  /** 远端参与方（LiveKit 房间实时视图，进房后由房间事件维护） */
  participants: CallPeer[];
  /** 已知参与方展示名（发起时的选人结果 + 推送携带），键为 userId */
  participantNames: Record<string, string>;
  /** LiveKit 入会三件套 */
  room: string;
  token: string;
  wsUrl: string;
  /** 接通时刻（计时长用） */
  connectedAt: number | null;
  micOn: boolean;
  camOn: boolean;
  /** 本端媒体发布失败的持久提示（toast 太易错过；挂到浮层上直到重拨） */
  micError: string | null;
  /** 单聊远端摄像头轨（1:1 全屏视图用；多人网格走 participants） */
  remoteVideoTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;

  /** 1:1 主叫入口（聊天窗头部按钮） */
  startCall: (peerId: string, peerName: string, mediaType: CallMediaType) => Promise<void>;
  /** 群聊通话主叫入口：peerIds 不含自己，names 为选人结果；groupId 决定记录落群会话 */
  startGroupCall: (peerIds: string[], names: Record<string, string>, mediaType: CallMediaType, groupId?: string) => Promise<void>;
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
/** 远端语音的播放元素（按参与方 identity 一人一个，持引用防 GC） */
const remoteAudioEls = new Map<string, HTMLAudioElement>();

function idle(): Pick<
  CallState,
  'phase' | 'callId' | 'peerId' | 'peerName' | 'peerAvatar' | 'mediaType' | 'isGroupCall' | 'participantCount' | 'participants' | 'participantNames' | 'room' | 'token' | 'wsUrl' | 'connectedAt' | 'micOn' | 'camOn' | 'micError' | 'remoteVideoTrack' | 'localVideoTrack'
> {
    return {
      phase: 'idle',
      callId: null,
      peerId: '',
      peerName: '',
      peerAvatar: '',
      mediaType: CallMediaType.AUDIO,
      isGroupCall: false,
      participantCount: 0,
      participants: [],
      participantNames: {},
      room: '',
      token: '',
      wsUrl: '',
      connectedAt: null,
      micOn: true,
      camOn: true,
      micError: null,
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

/** 从已知名字簿解析展示名：群邀名册 > 好友列表 > 原始 ID */
function resolvePeerName(id: string): string {
  const s = useCallStore.getState();
  if (s.participantNames[id]) return s.participantNames[id];
  const friend = useFriendStore.getState().friends.find((f) => f.userId === id);
  return friend?.nickname || friend?.userName || id;
}

/** 用新信息补充名字簿（已有名字不覆盖：群邀时选定的名字优先） */
function rememberPeerName(id: string, name: string | undefined | null): void {
  if (!id || !name) return;
  const names = { ...useCallStore.getState().participantNames };
  if (!names[id]) {
    names[id] = name;
    useCallStore.setState({ participantNames: names });
  }
}

export const useCallStore = create<CallState>()(() => ({
  ...idle(),

  /** 1:1 主叫入口（聊天窗头部按钮） */
  startCall: async (peerId, peerName, mediaType) => {
    await startOutgoingCommon({ [peerId]: peerName }, mediaType, { peerId, peerName });
  },

  /** 群聊通话主叫入口（群聊窗口选人发起） */
  startGroupCall: async (peerIds, names, mediaType, groupId) => {
    const first = peerIds[0] ?? '';
    await startOutgoingCommon(names, mediaType, {
      peerId: first,
      peerName: names[first] || first,
    }, peerIds, groupId);
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
      const isGroup = (event.participantCount ?? 0) > 2;
      useCallStore.setState({
        phase: 'incoming',
        callId: event.callId,
        peerId: event.peerId,
        peerName: event.peerNickname || event.peerUserName || friend?.nickname || event.peerId,
        peerAvatar: friend?.avatar || '',
        mediaType: event.mediaType,
        isGroupCall: isGroup,
        participantCount: event.participantCount ?? 0,
        participants: [],
        participantNames: {},
      });
      rememberPeerName(event.peerId, event.peerNickname || event.peerUserName);
      startIncomingRing();
      return;
    }

    if (event.event === 2) {
      // 对方（或群聊中某成员）接听：主叫拿自己的入会材料进房。
      // 已在 active 中时后续接听不再重复进房（新人由 LiveKit ParticipantConnected 呈现），只记名字。
      if (s.phase === 'idle' || event.callId !== s.callId) return;
      rememberPeerName(event.peerId, event.peerNickname || event.peerUserName);
      if (s.phase !== 'outgoing') return;
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
      // 会话窗口/列表的通话记录由服务端系统消息（MSG_TYPE_SYSTEM）驱动，本地不再自行生成
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
      await livekitRoom.localParticipant.setCameraEnabled(next, CAM_CAPTURE, CAM_PUBLISH);
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

/** 主叫公共路径：置 outgoing 态 → inviteCall（群聊传数组）→ 落 callId */
async function startOutgoingCommon(
  names: Record<string, string>,
  mediaType: CallMediaType,
  peerView: { peerId: string; peerName: string },
  peerIds?: string[],
  groupId?: string,
): Promise<void> {
  ensureAudioUnlocked();
  const client = getIMClient();
  if (!client) {
    toast('连接未就绪，请稍后再试');
    return;
  }
  useCallStore.setState({
    phase: 'outgoing',
    peerId: peerView.peerId,
    peerName: peerView.peerName,
    mediaType,
    isGroupCall: (peerIds?.length ?? 0) > 1,
    participantCount: (peerIds?.length ?? 1) + 1,
    participantNames: { ...names },
    callId: null,
  });
  startOutgoingRing();
  try {
    const resp = peerIds && peerIds.length > 1
      ? await client.inviteCall(peerIds, mediaType, groupId)
      : await client.inviteCall(peerView.peerId, mediaType);
    // 振铃期间可能已被 end（极少）：仅在仍是同一通 outgoing 时落 callId
    const cur = useCallStore.getState();
    if (cur.phase === 'outgoing' && cur.peerId === peerView.peerId) {
      useCallStore.setState({ callId: resp.callId });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '呼叫失败';
    stopRing();
    useCallStore.setState(idle());
    toast(msg);
  }
}

// ------------------------------------------------------------------
// LiveKit 房间
// ------------------------------------------------------------------

/**
 * 摄像头采集/编码参数：480p + 500kbps 上限。
 * 弱带宽部署（如 3Mbps 云主机）下 SFU 双向约 1.2Mbps/路，两路并发视频也能跑；
 * toggleCam 恢复推流时必须复用同一组参数，否则画质回退到默认 720p。
 */
const CAM_CAPTURE = { resolution: { width: 640, height: 480, frameRate: 24 } };
const CAM_PUBLISH = { videoEncoding: { maxBitrate: 500_000, maxFramerate: 24 } };

/** 依名字簿更新远端参与方列表（保留已有 video 轨） */
function upsertPeer(id: string, video: MediaStreamTrack | null | undefined): void {
  const cur = useCallStore.getState().participants;
  const idx = cur.findIndex((p) => p.id === id);
  if (idx >= 0) {
    if (video === undefined) return;
    const next = [...cur];
    next[idx] = { ...next[idx], video };
    useCallStore.setState({ participants: next });
    return;
  }
  useCallStore.setState({
    participants: [...cur, { id, name: resolvePeerName(id), video: video ?? null }],
  });
}

function removePeer(id: string): void {
  useCallStore.setState({
    participants: useCallStore.getState().participants.filter((p) => p.id !== id),
  });
  const el = remoteAudioEls.get(id);
  if (el) {
    el.remove();
    remoteAudioEls.delete(id);
  }
}

async function joinLiveKit(): Promise<void> {
  const { room, token, wsUrl, mediaType } = useCallStore.getState();
  if (!room || !token || !wsUrl) return;
  try {
    const { Room, RoomEvent, Track } = await import('livekit-client');
    await leaveLiveKit();
    const lk = new Room({ adaptiveStream: true, dynacast: true });
    livekitRoom = lk;

    lk.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
      console.info('[Call] 订阅到远端轨:', track.source, track.kind);
      const id = participant?.identity ?? '';
      if (track.kind === 'video') {
        useCallStore.setState({ remoteVideoTrack: track.mediaStreamTrack });
        if (id) upsertPeer(id, track.mediaStreamTrack);
      } else if (track.kind === 'audio') {
        // 远端语音：按参与方各挂一个 <audio>；持引用防 GC，离房时统一清理
        remoteAudioEls.get(id)?.remove();
        const el = track.attach();
        el.autoplay = true;
        el.play?.().catch(() => { /* 自动播放被拦时保持静默，用户点界面任意处即解锁 */ });
        remoteAudioEls.set(id, el);
      }
    });
    lk.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
      track.detach();
      const id = participant?.identity ?? '';
      if (track.kind === 'video') {
        useCallStore.setState({ remoteVideoTrack: null });
        if (id) upsertPeer(id, null);
      }
      if (track.kind === 'audio' && id) {
        remoteAudioEls.get(id)?.remove();
        remoteAudioEls.delete(id);
      }
    });
    lk.on(RoomEvent.ParticipantConnected, (participant) => {
      rememberPeerName(participant.identity, participant.name);
      upsertPeer(participant.identity, undefined);
    });
    lk.on(RoomEvent.ParticipantDisconnected, (participant) => {
      removePeer(participant.identity);
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
      // 本端主动挂断（hangup/收尾）会先清引用，命中不了这个分支；
      // 走到这里说明是媒体面意外掉线（对端崩溃/断网）：主动请服务端收尾，
      // 否则会话要等 2h 上限定时器才结束，期间双方一直“忙线”
      if (livekitRoom !== lk) {
        return;
      }
      livekitRoom = null;
      const s = useCallStore.getState();
      if (s.phase === 'active' && s.callId) {
        void getIMClient()?.endCall(s.callId, CallEndReason.HANGUP).catch(() => { /* 服务端有定时器兜底 */ });
      }
    });

    await lk.connect(wsUrl, token);

    // 进房时已在房间里的其他参与方（群聊先到者）立即入列
    for (const p of Array.from(lk.remoteParticipants?.values() ?? [])) {
      rememberPeerName(p.identity, p.name);
      const cam = p.getTrackPublication?.(Track.Source.Camera);
      upsertPeer(p.identity, cam?.track?.mediaStreamTrack ?? null);
    }

    // 关键：发布本端媒体。livekit-client 不会自动推流，不调 enable 则整通无声/无画面
    try {
      await lk.localParticipant.setMicrophoneEnabled(true);
      useCallStore.setState({ micOn: true, micError: null });
      console.info('[Call] 本端麦克风已发布');
    } catch (err) {
      const name = (err as DOMException)?.name;
      const msg =
        name === 'NotAllowedError' ? '麦克风权限被拒绝：点击地址栏左侧的锁/摄像头图标允许，然后重新拨打'
        : name === 'NotFoundError' ? '未检测到麦克风设备'
        : name === 'NotReadableError' ? '麦克风被其他应用占用'
        : `麦克风不可用：${err instanceof Error ? err.message : String(err)}`;
      useCallStore.setState({ micOn: false, micError: msg });
      console.warn('[Call] 麦克风发布失败:', name, err);
    }
    if (mediaType === CallMediaType.VIDEO) {
      try {
        await lk.localParticipant.setCameraEnabled(true, CAM_CAPTURE, CAM_PUBLISH);
        useCallStore.setState({ camOn: true });
        console.info('[Call] 本端摄像头已发布');
      } catch (err) {
        const name = (err as DOMException)?.name;
        const msg =
          name === 'NotAllowedError' ? '摄像头权限被拒绝：点击地址栏左侧的图标允许后重拨'
          : name === 'NotFoundError' ? '未检测到摄像头设备'
          : `摄像头不可用：${err instanceof Error ? err.message : String(err)}`;
        useCallStore.setState({ camOn: false });
        console.warn('[Call] 摄像头发布失败:', name, err);
        toast(msg);
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
  remoteAudioEls.forEach((el) => el.remove());
  remoteAudioEls.clear();
}
