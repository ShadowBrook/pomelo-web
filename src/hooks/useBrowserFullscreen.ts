import { useCallback, useEffect, useState } from 'react';

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isFullscreenNow(): boolean {
  const doc = document as FsDocument;
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}

/**
 * 浏览器原生全屏（Fullscreen API），对整个文档生效——
 * 不同于页面内的"铺满"，用户按 Esc 或系统手势即可退出。
 * Safari 16.4 之前只有 webkit 前缀 API，这里做降级兼容。
 */
export function useBrowserFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenNow);

  useEffect(() => {
    const onChange = () => setIsFullscreen(isFullscreenNow());
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const doc = document as FsDocument;
    if (isFullscreenNow()) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else {
        doc.webkitExitFullscreen?.();
      }
      return;
    }
    const root = document.documentElement as FsElement;
    if (root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    } else {
      root.webkitRequestFullscreen?.();
    }
  }, []);

  return { isFullscreen, toggle };
}
