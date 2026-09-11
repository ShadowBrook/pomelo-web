/**
 * 来电/回铃音（WebAudio 合成，避免引入二进制音频资源）。
 * 来电 = 双音断续（经典"嘟-嘟"）；回铃（等待对方接）= 单音慢响。
 * 浏览器自动播放策略：AudioContext 需在用户手势后 resume——
 * 来电场景由"登录后首次点击页面"满足；resume 失败则静默降级为无铃声。
 */
let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function beep(freq: number, durationMs: number, gainValue = 0.06): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

function stopLoop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** 来电铃声：双音循环 */
export function startIncomingRing(): void {
  if (!ensureCtx() || timer) return;
  const pattern = () => {
    beep(880, 180);
    setTimeout(() => beep(660, 220), 220);
  };
  pattern();
  timer = setInterval(pattern, 1600);
}

/** 回铃音：等待对方接听 */
export function startOutgoingRing(): void {
  if (!ensureCtx() || timer) return;
  const pattern = () => beep(440, 400, 0.04);
  pattern();
  timer = setInterval(pattern, 3000);
}

export function stopRing(): void {
  stopLoop();
}
