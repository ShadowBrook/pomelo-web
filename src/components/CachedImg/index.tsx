import type { CSSProperties, ReactNode } from 'react';
import { useCachedMediaUrl } from '@/utils/mediaCache';

/**
 * 走稳定缓存的远程图片：命中缓存即时显示，未就绪时渲染 fallback。
 * 预签名 URL 每次签名不同，直接 <img src> 会反复重新下载（头像/图片/封面都受影响）。
 */
export function CachedImg({
  url,
  alt = '',
  className,
  fallback = null,
  onClick,
  style,
}: {
  url?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const src = useCachedMediaUrl(url);
  if (!src) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onClick={onClick} style={style} />;
}

/** 头像：无图或未就绪时回退为首字符（与外层容器的文字样式一致） */
export function AvatarImg({
  url,
  name,
  className,
}: {
  url?: string | null;
  name: string;
  className?: string;
}) {
  return (
    <CachedImg
      url={url}
      alt={name}
      className={className}
      fallback={name.charAt(0).toUpperCase()}
    />
  );
}
