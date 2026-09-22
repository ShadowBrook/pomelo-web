import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { IMClient } from './client';
import { decode, encode } from './protocol';
import { enc, im, plain } from './pbcodec';
import { Cmd } from './types';

/**
 * 离线同步水位回归：pullPending 的起始游标必须来自**本地已存消息的最大 seq**。
 *
 * 之前水位只活在内存里，刷新页面归零 → 每次打开都把收件箱从第一条（最多 50 条一页）
 * 重新拉一遍。这里在协议层断言：登录时交给客户端的水位会出现在 PULL_REQ 的 seq 上。
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

function authRespFrame(code: number, userId = 1): ArrayBuffer {
  return encode(Cmd.AUTH_RESP, 'a', enc(im.auth.AuthResp, { code, message: 'ok', userId }), '');
}

/** 拉取响应：一条携带信箱 seq 的消息，客户端处理完应把水位推到该 seq */
function pullRespFrame(messageId: string, seq: number): ArrayBuffer {
  return encode(
    Cmd.PULL_RESP,
    messageId,
    enc(im.pull.PullResp, {
      code: 0,
      hasMore: false,
      messages: [
        {
          msgType: 1,
          content: new Uint8Array([104, 105]),
          timestamp: 1700000000000,
          ext: {
            id: '500' + seq,
            seq: String(seq),
            senderId: '2',
            recipientId: '1',
            senderUserName: 'bob',
            senderNickname: 'Bob',
          },
        },
      ],
    }),
    '',
  );
}

const pullReqs = (fake: FakeWebSocket) =>
  fake
    .frames()
    .filter((f) => f.cmd === Cmd.PULL_REQ)
    .map((f) => Number(plain(im.pull.PullReq, f.body)?.seq ?? 0));

describe('离线同步水位', () => {
  let client: IMClient;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
  });

  afterEach(() => {
    client?.disconnect();
    vi.unstubAllGlobals();
  });

  async function connectClient(seq: number): Promise<FakeWebSocket> {
    client = new IMClient({ url: 'ws://test' });
    client.setSyncSeq(seq);
    const p = client.connect('u1', 'tok', 'alice', 'Alice');
    const fake = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
    fake.serverOpen();
    await p;
    return fake;
  }

  it('登录水位写进 PULL_REQ：只拉本地最大 seq 之后的增量', async () => {
    const fake = await connectClient(42);
    fake.serverPush(authRespFrame(0));
    await vi.waitFor(() => expect(pullReqs(fake)).toContain(42));
  });

  it('水位只抬不降：收到的消息会把水位推高，之后的登录估算值不会把它拉回去', async () => {
    const fake = await connectClient(42);
    fake.serverPush(authRespFrame(0));
    let pullId = '';
    await vi.waitFor(() => {
      expect(pullReqs(fake)).toEqual([42]);
      pullId = fake.frames().find((f) => f.cmd === Cmd.PULL_REQ)!.messageId;
    });

    fake.serverPush(pullRespFrame(pullId, 99));
    await vi.waitFor(() => expect(client.getSyncSeq()).toBe(99));
    // 登录时按本地消息估算的水位比真实值低时不回调（否则会重复拉已同步过的消息）
    client.setSyncSeq(45);
    expect(client.getSyncSeq()).toBe(99);
  });
});
