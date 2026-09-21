import { useEffect, useState } from 'react';
import { useCallStore } from '@/stores/useCallStore';
import { CallMediaType } from '@/sdk/types';

/**
 * 音视频通话浮层：来电 / 呼出 / 通话中三态，全屏覆盖。
 * 群聊通话（isGroupCall）走多人网格布局：视频为宫格（无画面回落头像），
 * 语音为头像阵列；1:1 保持原来的全屏远端 + 本端画中画。
 * LiveKit 房间生命周期在 useCallStore，本组件只负责呈现与操作入口。
 */
export function CallOverlay() {
  const s = useCallStore();
  const [now, setNow] = useState(Date.now());

  // 通话计时
  useEffect(() => {
    if (s.phase !== 'active' || !s.connectedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [s.phase, s.connectedAt]);

  if (s.phase === 'idle') return null;

  const durationText = () => {
    if (!s.connectedAt) return '00:00';
    const total = Math.max(0, Math.floor((now - s.connectedAt) / 1000));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const mediaLabel = s.mediaType === CallMediaType.VIDEO ? '视频通话' : '语音通话';

  return (
    <div className="fixed inset-0 z-[60] bg-[#12161b]/95 backdrop-blur-sm select-none">
      {s.phase === 'incoming' && (
        <div className="h-full flex flex-col items-center justify-center gap-6">
          <RingingAvatar name={s.peerName} avatar={s.peerAvatar} />
          <div className="text-center">
            <div className="text-xl text-white font-medium">{s.peerName}</div>
            <div className="text-sm text-white/60 mt-1">
              {s.isGroupCall ? `邀请你参与群聊通话（${s.participantCount} 人）…` : `邀请你${mediaLabel}…`}
            </div>
          </div>
          <div className="flex gap-16 mt-6">
            <CallButton label="拒绝" tone="danger" onClick={() => void useCallStore.getState().reject()}>
              <path d="M3.7 21.3 21.3 3.7M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
            </CallButton>
            <CallButton label="接听" tone="ok" onClick={() => void useCallStore.getState().accept()}>
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
            </CallButton>
          </div>
        </div>
      )}

      {s.phase === 'outgoing' && (
        <div className="h-full flex flex-col items-center justify-center gap-6">
          <RingingAvatar name={s.peerName} avatar={s.peerAvatar} />
          <div className="text-center">
            <div className="text-xl text-white font-medium">{s.peerName}</div>
            <div className="text-sm text-white/60 mt-1">
              {s.isGroupCall ? '正在等待其他成员加入…' : `正在等待对方接受${mediaLabel}…`}
            </div>
          </div>
          <div className="mt-6">
            <CallButton label="取消" tone="danger" onClick={() => void useCallStore.getState().hangup()}>
              <path d="M6 6l12 12M18 6L6 18" />
            </CallButton>
          </div>
        </div>
      )}

      {s.phase === 'active' && (
        <div className="h-full relative bg-black">
          {/* 麦克风发布失败的持久提示（权限类问题 toast 一闪就没了，必须钉在界面上） */}
          {s.micError && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-warn/90 text-white text-xs px-3 py-1.5 rounded shadow-lg max-w-[80%] text-center">
              ⚠ {s.micError}
            </div>
          )}
          {/* 群聊通话：多人网格；1:1：全屏远端 + 本端画中画 / 头像 */}
          {s.isGroupCall ? (
            <GroupCallGrid mediaType={s.mediaType} />
          ) : s.mediaType === CallMediaType.VIDEO ? (
            <>
              <RemoteVideo />
              {s.localVideoTrack && (
                <div className="absolute bottom-24 right-4 w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-xl ring-1 ring-white/20 bg-black">
                  <LocalVideo />
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <RingingAvatar name={s.peerName} avatar={s.peerAvatar} still />
              <div className="text-xl text-white font-medium">{s.peerName}</div>
            </div>
          )}

          {/* 顶部：对端 + 时长 */}
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
            <span className="text-white/90 text-sm">
              {s.isGroupCall ? `群聊通话 · ${Math.max(s.participantCount, s.participants.length + 1)} 人` : s.peerName}
            </span>
            <span className="text-white/60 text-xs tabular-nums">{durationText()}</span>
          </div>

          {/* 控制条 */}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-10">
            <CallButton
              label={s.micOn ? '闭麦' : '开麦'}
              tone="ghost"
              onClick={() => void useCallStore.getState().toggleMic()}
            >
              {s.micOn ? (
                <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zM19 11a7 7 0 0 1-14 0M12 18v3" />
              ) : (
                <path d="M9 9v3a3 3 0 0 0 4.7 2.5M15 11.5V6a3 3 0 0 0-5.7-1.3M19 11a7 7 0 0 1-1.2 3.9M5 11a7 7 0 0 0 10.4 6.1M12 18v3M8.5 21.5h7" />
              )}
            </CallButton>

            {s.mediaType === CallMediaType.VIDEO && (
              <CallButton
                label={s.camOn ? '关摄像头' : '开摄像头'}
                tone="ghost"
                onClick={() => void useCallStore.getState().toggleCam()}
              >
                {s.camOn ? (
                  <path d="M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM16 10l5-3v10l-5-3" />
                ) : (
                  <path d="M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM16 10l5-3v10l-5-3M3 3l18 18" />
                )}
              </CallButton>
            )}

            <CallButton label="挂断" tone="danger" onClick={() => void useCallStore.getState().hangup()}>
              <path d="M3.5 5.5c5-3 12-3 17 0l.5.3c.8.5 1 1.6.5 2.4l-1.6 2.4c-.4.6-1.2.9-1.9.6l-2.9-1.1a1.5 1.5 0 0 1-.9-1.7l.3-1.4c-2-.6-4.2-.6-6.2 0l.3 1.4c.2.8-.2 1.5-.9 1.7l-2.9 1.1c-.7.3-1.5 0-1.9-.6L3 8.2c-.5-.8-.3-1.9.5-2.4l0-.3z" />
            </CallButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// 群聊通话网格
// ------------------------------------------------------------------

/** 多人网格：视频为宫格（无画面回落头像），语音为头像阵列。含本端一席。 */
function GroupCallGrid({ mediaType }: { mediaType: CallMediaType }) {
  const participants = useCallStore((st) => st.participants);
  const names = useCallStore((st) => st.participantNames);
  const myName = '我';
  const tiles = [
    ...participants.map((p) => ({ key: p.id, name: names[p.id] || p.name, video: p.video, self: false })),
    { key: '__self__', name: myName, video: null as MediaStreamTrack | null, self: true },
  ];
  const cols = tiles.length <= 4 ? 2 : 3;

  if (mediaType !== CallMediaType.VIDEO) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 pb-28">
        <div className={`grid gap-6 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {tiles.map((t) => (
            <AvatarTile key={t.key} name={t.name} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pb-28 p-2">
      <div className={`h-full grid gap-2 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'} grid-rows-[repeat(auto-fit,minmax(0,1fr))]`}>
        {tiles.map((t) =>
          t.self ? (
            <VideoTile key={t.key} name={t.name} localVideo self={t.self} />
          ) : (
            <VideoTile key={t.key} name={t.name} track={t.video} />
          ),
        )}
      </div>
    </div>
  );
}

/** 头像席位（语音通话 / 无画面回落） */
function AvatarTile({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-full bg-primary/40 flex items-center justify-center text-white text-2xl font-bold">
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="text-white/80 text-xs max-w-full truncate">{name}</span>
    </div>
  );
}

function VideoTile({ name, track, localVideo = false, self = false }: {
  name: string;
  track?: MediaStreamTrack | null;
  localVideo?: boolean;
  self?: boolean;
}) {
  const localTrack = useCallStore((st) => st.localVideoTrack);
  const effective = localVideo ? localTrack : (track ?? null);
  return (
    <div className={`relative rounded-lg overflow-hidden bg-[#1c2229] ${self ? 'ring-1 ring-primary/60' : ''}`}>
      {effective ? (
        <PeerVideo track={effective} muted={self} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <AvatarTile name={name} />
        </div>
      )}
      <span className="absolute left-2 bottom-2 px-1.5 py-0.5 rounded bg-black/50 text-white/90 text-xs max-w-[80%] truncate">
        {name}
      </span>
    </div>
  );
}

/** srcObject 需命令式挂载，走 ref effect 而非 JSX 属性 */
function PeerVideo({ track, muted = false }: { track: MediaStreamTrack; muted?: boolean }) {
  return (
    <video
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full object-cover"
      ref={(el) => {
        if (el) {
          el.srcObject = new MediaStream([track]);
        }
      }}
    />
  );
}

/** 呼出/来电态的头像 + 脉冲光环 */
function RingingAvatar({ name, avatar, still = false }: { name: string; avatar: string; still?: boolean }) {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {!still && (
        <>
          <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          <span className="absolute -inset-3 rounded-full bg-white/5 animate-pulse" />
        </>
      )}
      <div className="w-24 h-24 rounded-full bg-primary/40 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
        {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

/** 圆形操作按钮 */
function CallButton({ label, tone, onClick, children }: {
  label: string;
  tone: 'danger' | 'ok' | 'ghost';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const toneCls =
    tone === 'danger'
      ? 'bg-danger hover:bg-danger/80 text-white'
      : tone === 'ok'
        ? 'bg-ok hover:bg-ok/80 text-white'
        : 'bg-white/10 hover:bg-white/20 text-white';
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${toneCls}`}
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

/** srcObject 需命令式挂载，走 ref effect 而非 JSX 属性 */
function RemoteVideo() {
  const remoteVideoTrack = useCallStore((st) => st.remoteVideoTrack);
  useEffect(() => {
    const el = document.getElementById('call-remote-video') as HTMLVideoElement | null;
    if (!el) return;
    el.srcObject = remoteVideoTrack ? new MediaStream([remoteVideoTrack]) : null;
  }, [remoteVideoTrack]);
  return <video id="call-remote-video" autoPlay playsInline className="w-full h-full object-cover" />;
}

function LocalVideo() {
  const localVideoTrack = useCallStore((st) => st.localVideoTrack);
  useEffect(() => {
    const el = document.getElementById('call-local-video') as HTMLVideoElement | null;
    if (!el) return;
    el.srcObject = localVideoTrack ? new MediaStream([localVideoTrack]) : null;
  }, [localVideoTrack]);
  return <video id="call-local-video" autoPlay muted playsInline className="w-full h-full object-cover" />;
}
