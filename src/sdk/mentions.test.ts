import { describe, expect, it } from 'vitest';
import protoRoot from '../sdk/proto/pomelo.proto.js';
import { IMClient } from '../sdk/client';

describe('群消息 @ 提及归一化', () => {
  it('C2GNotify.ext.mentioned_user_ids → GroupMessage.mentions', () => {
    const Notify = (protoRoot as any).im.group.C2GNotify;
    const bytes = Notify.encode(
      Notify.fromObject({
        senderId: '111',
        groupId: '222',
        messageId: '42',
        seq: 5,
        message: {
          msgType: 1,
          content: new TextEncoder().encode('@bob 看这条'),
          ext: { mentioned_user_ids: '999,888', senderNickname: 'alice' },
        },
      }),
    ).finish();
    const raw = Notify.decode(bytes);
    // 复刻 pbcodec.plain 的 toObject 选项
    const g = Notify.toObject(raw, { longs: String, enums: Number, defaults: true });

    const client = new IMClient({ url: 'ws://127.0.0.1:1' });
    const gm = (client as any)._c2gNotifyToGroupMessage(g, 'fallback-id');

    expect(gm.mentions).toEqual(['999', '888']);
    expect(gm.content).toBe('@bob 看这条');
  });

  it('无 mentions 时字段为 undefined（不产生空数组）', () => {
    const Notify = (protoRoot as any).im.group.C2GNotify;
    const bytes = Notify.encode(
      Notify.fromObject({ senderId: '1', groupId: '2', message: { msgType: 1, content: new TextEncoder().encode('hi') } }),
    ).finish();
    const g = Notify.toObject(Notify.decode(bytes), { longs: String, defaults: true });
    const client = new IMClient({ url: 'ws://127.0.0.1:1' });
    const gm = (client as any)._c2gNotifyToGroupMessage(g, 'x');
    expect(gm.mentions).toBeUndefined();
  });
});
