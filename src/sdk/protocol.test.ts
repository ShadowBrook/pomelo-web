import { describe, it, expect } from 'vitest';
import { encode, decode, generateId } from './protocol';
import { Cmd, VERSION, CODEC_PROTOBUF } from './types';
import { enc, plain, text, im } from './pbcodec';

describe('protocol encode/decode (Protobuf codec)', () => {
  const userId = 'alice';

  it('codecId 字节在 offset 9 = CODEC_PROTOBUF (0)', () => {
    const buf = encode(Cmd.PING, '1', null, userId);
    const view = new DataView(buf);
    // offset 8 = version, offset 9 = codecId
    expect(view.getUint8(8)).toBe(VERSION);
    expect(view.getUint8(9)).toBe(CODEC_PROTOBUF);
    expect(CODEC_PROTOBUF).toBe(0);
  });

  it('protobuf 编码的 body 经 encode→decode 逐字节一致', () => {
    const messageId = '1721382600000001';
    const body = enc(im.chat.C2CReq, {
      senderId: '1',
      recipientId: '2',
      messageId: '3',
      message: { msgType: 1, content: new TextEncoder().encode('Hello!') },
    });
    const buf = encode(Cmd.C2C_REQ, messageId, body, userId);
    const result = decode(buf);

    expect(result.cmd).toBe(Cmd.C2C_REQ);
    expect(result.messageId).toBe(messageId);
    // body 逐字节一致（避免 Node Buffer 与 Uint8Array 的结构差异，按字节数组比较）
    expect(Array.from(result.body!)).toEqual(Array.from(body));

    // 二次编码与首次编码结果完全一致（body 原样字节透传）
    const buf2 = encode(Cmd.C2C_REQ, messageId, result.body!, userId);
    expect(Array.from(new Uint8Array(buf2))).toEqual(Array.from(new Uint8Array(buf)));
  });

  it('C2CReq 经 pbcodec 往返还原字段（camelCase → plain）', () => {
    const content = 'Hi protobuf 你好';
    const body = enc(im.chat.C2CReq, {
      senderId: '1001',
      recipientId: '1002',
      messageId: '9007199254740993123',
      message: { msgType: 1, content: new TextEncoder().encode(content) },
    });
    const obj = plain(im.chat.C2CReq, body);
    expect(obj.senderId).toBe('1001');
    expect(obj.recipientId).toBe('1002');
    // int64 → 字符串
    expect(obj.messageId).toBe('9007199254740993123');
    expect(obj.message.msgType).toBe(1);
    expect(text(obj.message.content)).toBe(content);
  });

  it('CMD_UPLOAD_RESP body 含 objectKey 与 presignedUrl（expireAt int64→字符串）', () => {
    const respBody = {
      code: 0,
      message: 'success',
      objectKey: 'image/alice/20260827/8841234567890123456.jpg',
      presignedUrl: 'http://localhost:9002/pomelo-media/image/alice/20260827/8841234567890123456.jpg?X-Amz-Signature=abc',
      expireAt: 1721382900000,
    };
    const body = enc(im.upload.UploadResp, respBody);
    const buf = encode(Cmd.CMD_UPLOAD_RESP, 'upload-r-1', body, userId);
    const result = decode(buf);
    const obj = plain(im.upload.UploadResp, result.body);
    expect(result.cmd).toBe(0x00a1);
    expect(obj.objectKey).toBe(respBody.objectKey);
    expect(obj.presignedUrl).toContain('X-Amz-Signature');
    expect(obj.expireAt).toBe(String(respBody.expireAt));
  });

  it('body 为 null 时 bodyLen=0，解码返回 null', () => {
    const messageId = '1721382600000002';
    const buf = encode(Cmd.PING, messageId, null, userId);
    const result = decode(buf);

    expect(result.cmd).toBe(Cmd.PING);
    expect(result.messageId).toBe(messageId);
    expect(result.body).toBeNull();
    expect(result.varHeaders['userId']).toBe(userId);
  });

  it('空 messageId 正确编解码', () => {
    const buf = encode(Cmd.PONG, '', null, userId);
    const result = decode(buf);

    expect(result.cmd).toBe(Cmd.PONG);
    expect(result.messageId).toBe('');
    expect(result.body).toBeNull();
  });

  it('varHeaders 包含 userId', () => {
    const buf = encode(Cmd.AUTH_REQ, 'auth-123', null, 'bob');
    const result = decode(buf);

    expect(result.varHeaders).toHaveProperty('userId', 'bob');
  });

  it('varHeaders 支持 extraHeaders 透传（如 peerId）', () => {
    const buf = encode(Cmd.PULL_REQ, 'history-1', enc(im.pull.PullReq, { seq: 0, limit: 50 }), userId, {
      peerId: 'bob',
    });
    const result = decode(buf);

    expect(result.varHeaders['userId']).toBe(userId);
    expect(result.varHeaders['peerId']).toBe('bob');
  });

  it('totalLen 字段正确（buffer.byteLength - 4）', () => {
    const buf = encode(Cmd.C2C_REQ, '100', enc(im.chat.C2CReq, { senderId: '1' }), userId);
    const view = new DataView(buf);
    const totalLen = view.getInt32(0, false);
    expect(totalLen).toBe(buf.byteLength - 4);
  });

  it('magic 字段校验：篡改后 decode 抛异常', () => {
    const buf = encode(Cmd.PING, '1', null, userId);
    const view = new DataView(buf);
    // 篡改 magic（offset 4~7）
    view.setInt32(4, 0xdeadbeef, false);
    expect(() => decode(buf)).toThrow(/Invalid magic/);
  });
});

describe('generateId', () => {
  it('返回数字字符串', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(Number.isFinite(Number(id))).toBe(true);
  });

  it('连续调用产生不同 ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
