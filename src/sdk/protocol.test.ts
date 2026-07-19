import { describe, it, expect } from 'vitest';
import { encode, decode, generateId } from './protocol';
import { Cmd, MAGIC, VERSION, CODEC_JSON } from './types';

describe('protocol encode/decode', () => {
  const userId = 'alice';

  it('roundtrip: cmd + messageId + body 完全一致', () => {
    const body = { senderId: 'alice', recipientId: 'bob', message: { msgType: 1, content: 'Hello!' } };
    const messageId = '1721382600000001';
    const buf = encode(Cmd.C2C_REQ, messageId, body, userId);
    const result = decode(buf);

    expect(result.cmd).toBe(Cmd.C2C_REQ);
    expect(result.messageId).toBe(messageId);
    expect(result.body).toEqual(body);
    expect(result.varHeaders['userId']).toBe(userId);
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
    const buf = encode(Cmd.AUTH_REQ, 'auth-123', { token: 'test-token' }, 'bob');
    const result = decode(buf);

    expect(result.varHeaders).toHaveProperty('userId', 'bob');
  });

  it('totalLen 字段正确（buffer.byteLength - 4）', () => {
    const buf = encode(Cmd.C2C_REQ, '100', { a: 1 }, userId);
    const view = new DataView(buf);
    const totalLen = view.getInt32(0, false);
    expect(totalLen).toBe(buf.byteLength - 4);
  });

  it('magic 字段校验：篡改后 decode 抛异常', () => {
    const buf = encode(Cmd.PING, '1', null, userId);
    const view = new DataView(buf);
    // 篡改 magic（offset 4~7）
    view.setInt32(4, 0xDEADBEEF, false);
    expect(() => decode(buf)).toThrow(/Invalid magic/);
  });

  it('version 和 codecId 字段正确', () => {
    const buf = encode(Cmd.PING, '1', null, userId);
    const view = new DataView(buf);
    // offset 8 = version, offset 9 = codecId
    expect(view.getUint8(8)).toBe(VERSION);
    expect(view.getUint8(9)).toBe(CODEC_JSON);
  });

  it('AUTH_REQ 完整字段验证', () => {
    const authBody = {
      token: 'test-token',
      userId: 'alice',
      deviceId: 'web',
      platform: 'web',
      appVersion: '1.0.0',
    };
    const messageId = 'auth-1721382600';
    const buf = encode(Cmd.AUTH_REQ, messageId, authBody, 'alice');
    const result = decode(buf);

    expect(result.cmd).toBe(0x0001);
    expect(result.messageId).toBe(messageId);
    expect(result.body).toEqual(authBody);
    expect(result.varHeaders['userId']).toBe('alice');
  });

  it('ACK body 含 messageIds 数组', () => {
    const ackBody = { messageIds: [1001, 1002, 1003], ackType: 0 };
    const buf = encode(Cmd.ACK_REQ, 'ack-123', ackBody, userId);
    const result = decode(buf);

    expect(result.cmd).toBe(Cmd.ACK_REQ);
    expect(result.body.messageIds).toEqual([1001, 1002, 1003]);
    expect(result.body.ackType).toBe(0);
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
