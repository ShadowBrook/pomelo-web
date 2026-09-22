import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IMClient } from './client';
import { decode, encode } from './protocol';
import { enc, im } from './pbcodec';
import { Cmd } from './types';

/**
 * 顶号互踢与多端同步回归测试：
 * 1. KICK_OFFLINE 通知触发 kicked 事件（带原因）并主动断开、不再重连；
 * 2. SYNC 通知触发一次增量 PULL（多端同步拉取）；
 * 3. 其余 Ctrl 类型（NOTIFY）不触发踢下线。
 */
class FakeWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  binaryType = '';
  sent: ArrayBuffer[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: ArrayBuffer }) => void) | null = null;
  onclose: ((e: { wasClean: boolean; code: number }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    FakeWebSocket.instances.push(this);
  }

  send(buf: ArrayBuffer) {
    this.sent.push(buf);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ wasClean: true, code: 1000 });
  }

  serverOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  serverPush(buf: ArrayBuffer) {
    this.onmessage?.({ data: buf });
  }

  frames() {
    return this.sent.map((buf) => decode(buf));
  }
}

function lastFake(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
}

function authRespFrame(code: number, userId = 1): ArrayBuffer {
  return encode(Cmd.AUTH_RESP, 'a', enc(im.auth.AuthResp, { code, message: 'ok', userId }), '');
}

function ctrlNotifyFrame(ctrlType: number, reason: string): ArrayBuffer {
  return encode(
    Cmd.CTRL_NOTIFY,
    'ctrl-1',
    enc(im.ctrl.CtrlNotify, { ctrlType, reason }),
    'u1',
  );
}

describe('IMClient 顶号互踢与多端同步', () => {
  let client: IMClient;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
  });

  afterEach(() => {
    client?.disconnect();
    vi.unstubAllGlobals();
  });

  async function connectClient(): Promise<FakeWebSocket> {
    client = new IMClient({ url: 'ws://test' });
    const p = client.connect('u1', 'tok', 'alice', 'Alice');
    const fake = lastFake();
    fake.serverOpen();
    await p;
    fake.serverPush(authRespFrame(0));
    await vi.waitFor(() => {
      expect(fake.frames().map((f) => f.cmd)).toContain(Cmd.PULL_REQ);
    });
    return fake;
  }

  it('KICK_OFFLINE：触发 kicked（带原因）并断开且不再重连', async () => {
    const fake = await connectClient();
    const kicked = vi.fn();
    client.on('kicked', kicked);

    fake.serverPush(ctrlNotifyFrame(im.ctrl.CtrlType.CTRL_TYPE_KICK_OFFLINE, '账号在其他同类型设备上登录，本会话已下线'));

    await vi.waitFor(() => expect(kicked).toHaveBeenCalled());
    expect(kicked).toHaveBeenCalledWith('账号在其他同类型设备上登录，本会话已下线');
    expect(fake.readyState).toBe(FakeWebSocket.CLOSED);
    // 断开后不得创建新连接（重连循环是顶号拉锯的根源）
    await new Promise((r) => setTimeout(r, 50));
    expect(FakeWebSocket.instances.length).toBe(1);
  });

  it('FORCE_LOGOUT 同样触发 kicked 并停止重连', async () => {
    const fake = await connectClient();
    const kicked = vi.fn();
    client.on('kicked', kicked);

    fake.serverPush(ctrlNotifyFrame(im.ctrl.CtrlType.CTRL_TYPE_FORCE_LOGOUT, '强制登出'));

    await vi.waitFor(() => expect(kicked).toHaveBeenCalled());
    expect(fake.readyState).toBe(FakeWebSocket.CLOSED);
  });

  it('SYNC：触发一次增量 PULL（多端同步）', async () => {
    const fake = await connectClient();
    const pullCount = () => fake.frames().filter((f) => f.cmd === Cmd.PULL_REQ).length;
    const before = pullCount();

    fake.serverPush(ctrlNotifyFrame(im.ctrl.CtrlType.CTRL_TYPE_SYNC, ''));

    await vi.waitFor(() => expect(pullCount()).toBe(before + 1));
  });

  it('CTRL_TYPE_NOTIFY：不触发踢下线，连接保持', async () => {
    const fake = await connectClient();
    const kicked = vi.fn();
    client.on('kicked', kicked);

    fake.serverPush(ctrlNotifyFrame(im.ctrl.CtrlType.CTRL_TYPE_NOTIFY, '公告'));

    await new Promise((r) => setTimeout(r, 30));
    expect(kicked).not.toHaveBeenCalled();
    expect(fake.readyState).toBe(FakeWebSocket.OPEN);
  });
});
