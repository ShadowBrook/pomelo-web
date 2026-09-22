import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmPasswordReset, getTerms, requestPasswordReset } from './api';

/** 找回密码 / 服务条款的 HTTP 契约（后端接口见 ApiVerticle 的 password-reset / legal 路由） */
describe('api：服务条款与找回密码', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(status: number, body: unknown) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }));
    });
    return calls;
  }

  it('getTerms：GET /api/legal/terms 返回 title/version/content', async () => {
    const calls = stubFetch(200, { code: 0, title: 'Pomelo 服务条款', version: '2026-09-22', content: '一、项目性质' });
    const res = await getTerms();
    expect(calls[0].url).toBe('/api/legal/terms');
    expect(res.title).toBe('Pomelo 服务条款');
    expect(res.content).toContain('项目性质');
  });

  it('requestPasswordReset：POST userName，返回脱敏邮箱', async () => {
    const calls = stubFetch(200, { code: 0, message: '验证码已发送至 a***@example.com', email: 'a***@example.com' });
    const res = await requestPasswordReset('alice');
    expect(calls[0].url).toBe('/api/user/password-reset/request');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ userName: 'alice' });
    expect(res.email).toBe('a***@example.com');
  });

  it('requestPasswordReset：未绑定邮箱（400）抛错并带上服务端文案', async () => {
    stubFetch(400, { code: 400, message: '该账号未绑定邮箱，请先登录后在设置中绑定' });
    await expect(requestPasswordReset('bob')).rejects.toThrow('该账号未绑定邮箱');
  });

  it('confirmPasswordReset：验证码错误（401）不触发登出，返回 code/message', async () => {
    stubFetch(401, { code: 401, message: '验证码错误' });
    const res = await confirmPasswordReset('alice', '000000', 'newpass123');
    expect(res.code).toBe(401);
    expect(res.message).toBe('验证码错误');
  });

  it('confirmPasswordReset：成功返回 code=0', async () => {
    const calls = stubFetch(200, { code: 0, message: '密码已重置，请用新密码登录' });
    const res = await confirmPasswordReset('alice', '123456', 'newpass123');
    expect(res.code).toBe(0);
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      userName: 'alice', code: '123456', newPassword: 'newpass123',
    });
  });
});
