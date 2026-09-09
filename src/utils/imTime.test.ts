import { describe, it, expect } from 'vitest';
import { formatListTime, formatMsgTime } from './imTime';

// 固定"现在"：2026-09-06 12:00 (周日)
const NOW = new Date(2026, 8, 6, 12, 0).getTime();

describe('formatListTime', () => {
  it('今天 → HH:mm', () => {
    expect(formatListTime(new Date(2026, 8, 6, 9, 5).getTime(), NOW)).toBe('09:05');
  });
  it('昨天 → 星期X', () => {
    expect(formatListTime(new Date(2026, 8, 5, 23, 0).getTime(), NOW)).toBe('星期六');
  });
  it('今年更早 → M月D日', () => {
    expect(formatListTime(new Date(2026, 5, 20, 10, 0).getTime(), NOW)).toBe('6月20日');
  });
  it('往年 → YY/MM/DD', () => {
    expect(formatListTime(new Date(2021, 11, 7, 10, 0).getTime(), NOW)).toBe('21/12/07');
  });
  it('ts=0 → 空串', () => {
    expect(formatListTime(0, NOW)).toBe('');
  });
});

describe('formatMsgTime', () => {
  it('今天下午 → 下午HH:mm', () => {
    expect(formatMsgTime(new Date(2026, 8, 6, 17, 33).getTime(), NOW)).toBe('下午17:33');
  });
  it('今天上午 → 上午HH:mm', () => {
    expect(formatMsgTime(new Date(2026, 8, 6, 9, 5).getTime(), NOW)).toBe('上午09:05');
  });
  it('非今天 → M月D日 上午/下午HH:mm', () => {
    expect(formatMsgTime(new Date(2026, 5, 21, 17, 33).getTime(), NOW)).toBe('6月21日 下午17:33');
  });
});
