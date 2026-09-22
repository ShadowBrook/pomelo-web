import { useEffect, useState } from 'react';
import { getTerms } from '@/utils/api';

interface Props {
  onClose: () => void;
}

/**
 * 服务条款弹窗：文案由服务端下发（GET /api/legal/terms），
 * 三端共用同一份，避免各自维护漂移。改文案只需改服务端 TermsOfService。
 */
export function TermsDialog({ onClose }: Props) {
  const [title, setTitle] = useState('服务条款');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getTerms()
      .then((res) => {
        if (cancelled) return;
        setTitle(res.title || '服务条款');
        setVersion(res.version || '');
        setContent(res.content || '');
      })
      .catch(() => {
        if (!cancelled) setError('服务条款加载失败，请检查网络后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-panel rounded-lg shadow-xl w-[min(520px,92vw)] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <span className="text-sm font-medium text-text-main">
            {title}
            {version && <span className="ml-2 text-xs text-text-sub">版本 {version}</span>}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-page"
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-3 overflow-y-auto text-xs leading-6 text-text-main whitespace-pre-wrap">
          {loading && <span className="text-text-sub">加载中…</span>}
          {error && <span className="text-danger">{error}</span>}
          {!loading && !error && content}
        </div>
        <div className="px-4 py-3 border-t border-line flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded bg-primary text-white hover:opacity-90"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
