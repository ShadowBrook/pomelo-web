import { useEffect, useState } from 'react';

/**
 * 是否处于移动端布局（< md 断点 768px）。
 * <p>
 * 断点必须与 Tailwind 的 `md:` 前缀保持一致：CSS 布局切换（如 IMShell 的
 * 列表/聊天互斥显示）走纯 class，这里只服务需要 JS 分叉的行为——
 * 详情栏初始开合、桌面专属按钮的裁剪等。SSR/无 matchMedia 环境按桌面处理。
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 767px)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
