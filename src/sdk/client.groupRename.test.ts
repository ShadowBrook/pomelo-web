import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IMClient } from './client';
import { decode, encode } from './protocol';
import { enc, im, plain } from './pbcodec';
import { Cmd } from './types';

/**
 * 群名修改回归测试：
 * 1. updateGroupName 发送 CMD_GROUP_UPDATE_REQ（body 为 UpdateGroupReq），
 *    CMD_GROUP_UPDATE_RESP code=0 时 Promise resolve；
 * 2. INFO_UPDATED（type=7）成员变更推送解码为 groupMemberChange 事件并携带新群名 name。
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

describe('IMClient 群名修改', () => {
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

  it('updateGroupName：发送 UPDATE_REQ，RESP code=0 时 resolve', async () => {
    const fake = await connectClient();

    const done = client.updateGroupName('500', '新群名');
    await vi.waitFor(() => {
      expect(fake.frames().map((f) => f.cmd)).toContain(Cmd.CMD_GROUP_UPDATE_REQ);
    });
    const reqFrame = fake.frames().find((f) => f.cmd === Cmd.CMD_GROUP_UPDATE_REQ);
    expect(reqFrame && plainBody(im.group.UpdateGroupReq, reqFrame)).toEqual({ groupId: '500', name: '新群名' });

    fake.serverPush(encode(
      Cmd.CMD_GROUP_UPDATE_RESP,
      reqFrame!.messageId,
      enc(im.group.TransferGroupResp, { code: 0, message: 'success' }),
      '',
    ));
    await expect(done).resolves.toEqual({ code: 0, message: 'success' });
  });

  it('INFO_UPDATED 推送解码为 groupMemberChange 事件（type=INFO_UPDATED，携带新群名）', async () => {
    const fake = await connectClient();
    const handler = vi.fn();
    client.on('groupMemberChange', handler);

    fake.serverPush(encode(
      Cmd.GROUP_MEMBER_CHANGE_NOTIFY,
      'n-1',
      enc(im.group.GroupMemberChangeNotify, {
        groupId: 500n,
        type: 7,
        operatorId: 100n,
        name: '新群名',
      }),
      '',
    ));

    await vi.waitFor(() => expect(handler).toHaveBeenCalled());
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      groupId: '500',
      type: 'INFO_UPDATED',
      operatorId: '100',
      name: '新群名',
    }));
  });
});

/** decode 出的 body 是 protobuf bytes（base64 字符串），用 pbcodec 的 plain（longs→String）解回对象 */
function plainBody(msg: { decode: (b: Uint8Array) => unknown }, frame: { body: unknown }): unknown {
  const bytes = typeof frame.body === 'string' ? b64ToBytes(frame.body) : (frame.body as Uint8Array);
  return plain(msg as never, bytes);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
