import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { WinInfo } from '@/stores/useWindowStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useWindowDrag } from './useWindowDrag';

interface Props {
  win: WinInfo;
  width: number;
  height: number;
  title: ReactNode;
  children: ReactNode;
  /** 提供时替换默认标题文本（标题栏去默认内边距，内容自管布局） */
  headerContent?: ReactNode;
  /** 渲染在 ⛶/✕ 之前的额外标题栏按钮 */
  extraHeaderButtons?: ReactNode;
  /** 追加到标题栏的类（如 h-12） */
  barClassName?: string;
}

export function DraggableWindow({ win, width, height, title, children, headerContent, extraHeaderButtons, barClassName }: Props) {
  const focus = useWindowStore((s) => s.focus);
  const move = useWindowStore((s) => s.move);
  const close = useWindowStore((s) => s.close);
  const toggleFullscreen = useWindowStore((s) => s.toggleFullscreen);
  const { onPointerDown } = useWindowDrag(win, width, height, move);

  const style: CSSProperties = win.fullscreen
    ? { left: 0, top: 0, right: 0, bottom: 0, zIndex: win.zIndex }
    : { left: win.pos.x, top: win.pos.y, width, height, zIndex: win.zIndex };

  return createPortal(
    <div
      className={`fixed flex flex-col bg-panel border border-line shadow-2xl overflow-hidden ${win.fullscreen ? 'inset-0' : 'rounded-lg'}`}
      style={style}
      onPointerDown={() => focus(win.id)}
    >
      {/* 标题栏（深蓝渐变） */}
      <div
        className={`h-10 flex items-center justify-between flex-shrink-0 select-none bg-gradient-to-b from-titlebar-from to-titlebar-to ${barClassName ?? ''} ${headerContent ? '' : 'px-3'}`}
        onPointerDown={onPointerDown}
        onDoubleClick={() => toggleFullscreen(win.id)}
      >
        {headerContent ?? <div className="text-sm font-medium text-white truncate px-3">{title}</div>}
        <div className="flex items-center gap-1 pr-2">
          {extraHeaderButtons}
          <button
            onClick={() => toggleFullscreen(win.id)}
            title={win.fullscreen ? '还原' : '全屏'}
            className="w-6 h-6 rounded text-white/90 hover:bg-white/20 text-xs"
          >
            {win.fullscreen ? '❐' : '⛶'}
          </button>
          <button
            onClick={() => close(win.id)}
            title="关闭"
            className="w-6 h-6 rounded text-white/90 hover:bg-danger text-xs"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>,
    document.body,
  );
}
