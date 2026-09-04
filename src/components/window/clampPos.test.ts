import { describe, it, expect } from 'vitest';
import { clampPos } from './clampPos';

describe('clampPos', () => {
  const vw = 1920, vh = 1080, w = 780, h = 540;

  it('范围内位置不变', () => {
    expect(clampPos({ x: 100, y: 100 }, w, h, vw, vh)).toEqual({ x: 100, y: 100 });
  });

  it('y 不允许为负', () => {
    expect(clampPos({ x: 100, y: -50 }, w, h, vw, vh).y).toBe(0);
  });

  it('y 底部至少保留 40px', () => {
    expect(clampPos({ x: 100, y: vh }, w, h, vw, vh).y).toBe(vh - 40);
  });

  it('x 右侧至少保留 80px 可抓取', () => {
    expect(clampPos({ x: vw, y: 0 }, w, h, vw, vh).x).toBe(vw - 80);
  });

  it('x 左侧保留 80px（窗口大部分拖出左边界时仍可拉回）', () => {
    expect(clampPos({ x: -(w * 2), y: 0 }, w, h, vw, vh).x).toBe(-(w - 80));
  });

  it('窗口宽于视口时仍留 80px 可见', () => {
    const r = clampPos({ x: -3000, y: 0 }, 3000, 540, 1920, 1080);
    expect(r.x).toBe(-(3000 - 80));
  });
});
