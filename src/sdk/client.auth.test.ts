import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { IMClient } from './client';
import { decode, encode } from './protocol';
import { enc, im } from './pbcodec';
import { Cmd } from './types';

/**
 * 认证门槛回归测试：
 * 网关对未认证连接只放行 PING/AUTH_REQ，客户端必须：
 * 1. onopen 后只发 AUTH_REQ；
 * 2. AUTH_RESP 成功后才拉取离线消息并补发队列；
 * 3. 认证前调用的业务请求挂起等待、认证后放行；
 * 4. 认证失败触发 authExpired 且不发送业务命令；
 * 5. 群消息走队列并以 C2GReq 编码补发（kind 路径）。
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

  // 测试辅助：模拟服务端握手完成
  serverOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  // 测试辅助：模拟服务端下发帧
  serverPush(buf: ArrayBuffer) {
    this.onmessage?.({ data: buf });
  }

  frames() {
    return this.sent.map((buf) => decode(buf));
  }

  lastFrame() {
    return decode(this.sent[this.sent.length - 1]);
  }
}

function lastFake(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
}

function authRespFrame(code: number, userId = 1): ArrayBuffer {
  return encode(Cmd.AUTH_RESP, 'a', enc(im.auth.AuthResp, { code, message: 'ok', userId }), '');
}

function pullRespFrame(messageId: string): ArrayBuffer {
  // 响应帧必须回显请求帧的 messageId，客户端据此关联 pending
  return encode(Cmd.PULL_RESP, messageId, enc(im.pull.PullResp, { code: 0, messages: [], hasMore: false }), '');
}

describe('IMClient 认证门槛', () => {
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
    return fake;
  }

  it('onopen 后只发 AUTH_REQ，不发任何业务命令', async () => {
    const fake = await connectClient();
    const cmds = fake.frames().map((f) => f.cmd);
    expect(cmds).toEqual([Cmd.AUTH_REQ]);
  });

  it('认证前入队的消息保持 pending，AUTH_RESP 后按 kind 编码补发', async () => {
    const fake = await connectClient();

    const c2cId = client.sendMessage({ recipientId: 'peer1', msgType: 1, content: 'hi' });
    const groupId = client.sendGroupMessage('g1', 1, 'hi group');

    // 认证前：没有业务帧发出
    expect(fake.frames().map((f) => f.cmd)).toEqual([Cmd.AUTH_REQ]);

    fake.serverPush(authRespFrame(0));
    await vi.waitFor(() => {
      const cmds = fake.frames().map((f) => f.cmd);
      expect(cmds).toContain(Cmd.PULL_REQ);
      expect(cmds).toContain(Cmd.C2C_REQ);
      expect(cmds).toContain(Cmd.C2G_REQ);
    });

    // kind 路径：群消息必须以 C2G_REQ 补发，单聊以 C2C_REQ 补发
    const c2gFrame = fake.frames().find((f) => f.cmd === Cmd.C2G_REQ);
    expect(c2gFrame?.messageId).toBe(groupId);
    const c2cFrame = fake.frames().find((f) => f.cmd === Cmd.C2C_REQ);
    expect(c2cFrame?.messageId).toBe(c2cId);

    client.disconnect();
  });

  it('认证前调用的 pullHistory 挂起等待，认证后发出并收到响应', async () => {
    const fake = await connectClient();

    const p = client.pullHistory('peer1', 0, 10);
    expect(fake.frames().map((f) => f.cmd)).toEqual([Cmd.AUTH_REQ]);

    fake.serverPush(authRespFrame(0));
    let reqFrameId = '';
    await vi.waitFor(() => {
      const pullFrames = fake
        .frames()
        .filter((f) => f.cmd === Cmd.PULL_REQ && f.varHeaders['peerId'] === 'peer1');
      expect(pullFrames.length).toBe(1);
      reqFrameId = pullFrames[0].messageId;
    });

    fake.serverPush(pullRespFrame(reqFrameId));
    const resp = await p;
    expect(resp.code).toBe(0);
    expect(resp.messages).toEqual([]);

    client.disconnect();
  });

  it('认证失败触发 authExpired，不发送业务命令并断开', async () => {
    const fake = await connectClient();
    const expired = vi.fn();
    client.on('authExpired', expired);

    const p = client.pullHistory('peer1', 0, 10).catch((e) => e);
    fake.serverPush(authRespFrame(401));

    await vi.waitFor(() => expect(expired).toHaveBeenCalled());
    await expect(p).resolves.toBeInstanceOf(Error);
    // 认证失败：连接被主动关闭，业务命令始终未发出
    expect(fake.frames().map((f) => f.cmd)).toEqual([Cmd.AUTH_REQ]);
  });
});
