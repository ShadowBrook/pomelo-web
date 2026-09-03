// 在原始 proto 类与 SDK 其余部分之间的薄接缝。
// 生成的 pomelo.proto.d.ts 只声明了 `export namespace im`，但运行时 pomelo.proto.js
// 实际把 root 作为 default 导出；此处默认导入在 bundler 解析下解析为模块命名空间（含 im）。
import protoRoot from './proto/pomelo.proto.js';

export const im = protoRoot.im as any;

/**
 * 用 fromObject 将 camelCase 字段对象编码为 protobuf 字节。
 * fromObject 会自动把字符串转 int64 / Uint8Array 转 bytes；
 * 注意 bytes 字段（如 MessageContent.content）必须传 Uint8Array（utf8 编码的文本），
 * 直接传 JS 字符串会被当作 base64 解码。
 */
export function enc(cls: any, fields: object): Uint8Array {
  return cls.encode(cls.fromObject(fields)).finish();
}

/**
 * 解码 protobuf 字节并转换为 plain object。
 * longs → String：int64 变为 JS 字符串；enums → Number：枚举变为数字；
 * defaults: true：填充默认值；bytes 字段保持 Uint8Array。
 * 注意：protobufjs 的 toObject 选项 longs/enums 需要传构造器（String/Number），
 * 传字符串字面量 'String' 不会生效，int64 仍会以 Long 实例返回。
 */
export function plain(cls: any, bytes: Uint8Array | null, overrides?: object): any {
  const data = bytes ?? new Uint8Array(0);
  const msg = cls.decode(data);
  return cls.toObject(msg, { longs: String, enums: Number, defaults: true, ...overrides });
}

/** 将 Uint8Array 解码为 utf8 文本（MessageContent.content 是 bytes 字段）。 */
export function text(u8: Uint8Array): string {
  return new TextDecoder().decode(u8);
}
