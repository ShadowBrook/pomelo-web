import { MAGIC, VERSION, CODEC_JSON } from './types';

// 模块级单例，避免重复创建
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * 编码消息为二进制 ArrayBuffer
 *
 * 线协议格式（大端序）:
 *   totalLen(4) | magic(4) | version(1) | codecId(1) | cmd(4)
 *   | msgIdLen(4) | msgId(var)
 *   | hdrCnt(4) | [ keyLen(4) + key(var) + valLen(4) + val(var) ] ...
 *   | bodyLen(4) | body(var)
 *
 * totalLen = buffer.byteLength - 4（不含 totalLen 自身 4 字节）
 * 与后端 ImMessage.java L72 buffer.setInt(0, buffer.length() - 4) 对齐
 */
export function encode(
  cmd: number,
  messageId: string,
  body: object | null,
  userId: string,
  extraHeaders?: Record<string, string>,
): ArrayBuffer {
  const msgIdBytes = encoder.encode(messageId);
  const bodyBytes = body ? encoder.encode(JSON.stringify(body)) : new Uint8Array(0);

  // varHeaders: 始终包含 userId，可选附加 userName / nickname 等
  const hdrEntries: [string, Uint8Array, string, Uint8Array][] = [];
  if (userId) {
    const k = 'userId';
    const kb = encoder.encode(k);
    const vb = encoder.encode(userId);
    hdrEntries.push([k, kb, userId, vb]);
  }
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (v) {
        const kb = encoder.encode(k);
        const vb = encoder.encode(v);
        hdrEntries.push([k, kb, v, vb]);
      }
    }
  }

  // 预计算 header 区大小
  let hdrSize = 4; // hdrCnt(4)
  for (const [, kb, , vb] of hdrEntries) {
    hdrSize += 4 + kb.byteLength + 4 + vb.byteLength;
  }

  // 总大小 = totalLen(4) + magic(4) + version(1) + codecId(1) + cmd(4)
  //          + msgIdLen(4) + msgId(var) + hdrSize + bodyLen(4) + body(var)
  const totalSize = 4 + 4 + 1 + 1 + 4 + 4 + msgIdBytes.byteLength + hdrSize + 4 + bodyBytes.byteLength;

  const buf = new ArrayBuffer(totalSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let p = 0;

  // totalLen = buffer.byteLength - 4（与 ImMessage.java L72 对齐）
  view.setInt32(p, totalSize - 4, false); p += 4;
  // magic
  view.setInt32(p, MAGIC, false); p += 4;
  // version
  view.setUint8(p, VERSION); p += 1;
  // codecId
  view.setUint8(p, CODEC_JSON); p += 1;
  // cmd
  view.setInt32(p, cmd, false); p += 4;

  // messageId
  view.setInt32(p, msgIdBytes.byteLength, false); p += 4;
  bytes.set(msgIdBytes, p); p += msgIdBytes.byteLength;

  // varHeaders
  view.setInt32(p, hdrEntries.length, false); p += 4;
  for (const [, kb, , vb] of hdrEntries) {
    view.setInt32(p, kb.byteLength, false); p += 4;
    bytes.set(kb, p); p += kb.byteLength;
    view.setInt32(p, vb.byteLength, false); p += 4;
    bytes.set(vb, p); p += vb.byteLength;
  }

  // body
  view.setInt32(p, bodyBytes.byteLength, false); p += 4;
  if (bodyBytes.byteLength > 0) {
    bytes.set(bodyBytes, p);
  }

  return buf;
}

/**
 * 解码二进制 ArrayBuffer 为消息对象
 *
 * 从 offset 4 开始读取（跳过 totalLen 前 4 字节），
 * 与 WsGatewayVerticle.java L53 buffer.getBuffer(4, buffer.length()) 对齐
 */
export function decode(buffer: ArrayBuffer): {
  cmd: number;
  messageId: string;
  body: any;
  varHeaders: Record<string, string>;
} {
  const view = new DataView(buffer);
  let p = 4; // 跳过 totalLen

  // magic
  const magic = view.getInt32(p, false); p += 4;
  if (magic !== MAGIC) {
    throw new Error(`Invalid magic: 0x${magic.toString(16)}, expected 0x${MAGIC.toString(16)}`);
  }

  // version + codecId（解析后未使用，仅跳过字节）
  p += 1; // version
  p += 1; // codecId

  // cmd
  const cmd = view.getInt32(p, false); p += 4;

  // messageId
  const msgIdLen = view.getInt32(p, false); p += 4;
  let messageId = '';
  if (msgIdLen > 0) {
    messageId = decoder.decode(new Uint8Array(buffer, p, msgIdLen));
    p += msgIdLen;
  }

  // varHeaders — 读取并返回（im-sdk.js 原版丢弃了，我们保留）
  const varHeaders: Record<string, string> = {};
  const hdrCnt = view.getInt32(p, false); p += 4;
  for (let i = 0; i < hdrCnt; i++) {
    const keyLen = view.getInt32(p, false); p += 4;
    const key = decoder.decode(new Uint8Array(buffer, p, keyLen)); p += keyLen;
    const valLen = view.getInt32(p, false); p += 4;
    const val = decoder.decode(new Uint8Array(buffer, p, valLen)); p += valLen;
    varHeaders[key] = val;
  }

  // body
  const bodyLen = view.getInt32(p, false); p += 4;
  let body: any = null;
  if (bodyLen > 0) {
    const raw = decoder.decode(new Uint8Array(buffer, p, bodyLen));
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }
  }

  return { cmd, messageId, body, varHeaders };
}

/** 生成消息 ID（数字字符串，兼容后端 Long.parseLong） */
let seqCounter = 0;
export function generateId(): string {
  return String(Date.now() * 1000 + (seqCounter++ % 1000));
}
