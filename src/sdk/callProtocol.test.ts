import { describe, it, expect } from 'vitest';
import { encode, decode } from './protocol';
import { enc, plain, im } from './pbcodec';
import { Cmd, CallMediaType } from './types';

/**
 * 通话信令协议回路：0xB0~0xB8 命令经 wire 编解码后，body 能被 im.call.* 正确解析。
 * 这组断言同时钉住两端约定：后端 Cmd 枚举（common.proto）与本文件常量必须一致。
 */
describe('通话命令字', () => {
  it('0xB0~0xB8 与后端 proto 定义一致', () => {
    expect(Cmd.CALL_INVITE_REQ).toBe(0x00b0);
    expect(Cmd.CALL_INVITE_RESP).toBe(0x00b1);
    expect(Cmd.CALL_ACCEPT_REQ).toBe(0x00b2);
    expect(Cmd.CALL_ACCEPT_RESP).toBe(0x00b3);
    expect(Cmd.CALL_END_REQ).toBe(0x00b4);
    expect(Cmd.CALL_END_RESP).toBe(0x00b5);
    expect(Cmd.CALL_EVENT_PUSH).toBe(0x00b6);
    expect(Cmd.CALL_TOKEN_REQ).toBe(0x00b7);
    expect(Cmd.CALL_TOKEN_RESP).toBe(0x00b8);
  });

  it('CallMediaType 与后端枚举一致', () => {
    expect(CallMediaType.AUDIO).toBe(0);
    expect(CallMediaType.VIDEO).toBe(1);
    expect(im.call.CallMediaType.CALL_MEDIA_VIDEO).toBe(1);
  });
});

describe('通话信令 wire 回路', () => {
  it('INVITE_REQ：编码后按 wire 协议解出 cmd/messageId/body', () => {
    const body = enc(im.call.CallInviteReq, { peerId: '200', mediaType: 1 });
    const frame = encode(Cmd.CALL_INVITE_REQ, 'call-invite-1', body, '100');

    const msg = decode(frame);
    expect(msg.cmd).toBe(Cmd.CALL_INVITE_REQ);
    expect(msg.messageId).toBe('call-invite-1');

    const req = plain(im.call.CallInviteReq, msg.body);
    expect(req.peerId).toBe('200');
    expect(req.mediaType).toBe(1);
  });

  it('EVENT_PUSH：服务端推送解出事件字段（含 int64 peerId → string）', () => {
    const body = enc(im.call.CallEventPush, {
      callId: '123-abc',
      event: 1,
      mediaType: 0,
      peerId: '100',
      peerUserName: 'yz',
      peerNickname: '老 Y',
      reason: 0,
      room: '',
      token: '',
      wsUrl: '',
    });
    const frame = encode(Cmd.CALL_EVENT_PUSH, '', body, '');

    const msg = decode(frame);
    const push = plain(im.call.CallEventPush, msg.body);
    expect(push.callId).toBe('123-abc');
    expect(push.event).toBe(1);
    expect(String(push.peerId)).toBe('100');
    expect(push.peerNickname).toBe('老 Y');
  });

  it('ACCEPT_RESP：入会三件套（room/token/wsUrl）可解', () => {
    const body = enc(im.call.CallAcceptResp, {
      code: 0,
      message: 'success',
      room: 'call-1-abcd',
      token: 'eyJ.abc.def',
      wsUrl: 'ws://localhost:7880',
    });
    const resp = plain(im.call.CallAcceptResp, body);
    expect(resp.code).toBe(0);
    expect(resp.room).toBe('call-1-abcd');
    expect(resp.wsUrl).toBe('ws://localhost:7880');
  });
});
