import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { WinInfo } from '@/stores/useWindowStore';
import { clampPos } from './clampPos';

export function useWindowDrag(
  win: WinInfo,
  width: number,
  height: number,
  move: (id: string, pos: { x: number; y: number }) => void,
) {
  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if ((e.target as HTMLElement).closest('button, input, textarea')) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const baseX = win.pos.x;
      const baseY = win.pos.y;

      const onMove = (ev: PointerEvent) => {
        move(
          win.id,
          clampPos(
            { x: baseX + ev.clientX - startX, y: baseY + ev.clientY - startY },
            width, height, window.innerWidth, window.innerHeight,
          ),
        );
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [win.id, win.pos.x, win.pos.y, width, height, move],
  );

  return { onPointerDown };
}
