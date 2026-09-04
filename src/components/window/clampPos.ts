export interface Pos { x: number; y: number }

export function clampPos(pos: Pos, winW: number, _winH: number, vw: number, vh: number): Pos {
  const minX = -(winW - 80);
  const maxX = vw - 80;
  const maxY = Math.max(0, vh - 40);
  return {
    x: Math.min(maxX, Math.max(minX, pos.x)),
    y: Math.min(maxY, Math.max(0, pos.y)),
  };
}
