import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface Props {
  file: File;
  onConfirm: (file: File) => void;
  onClose: () => void;
}

/** 把裁剪结果导出为正方形 PNG File（头像统一走对象存储图片通道） */
async function cropToSquareFile(imageUrl: string, area: Area): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageUrl;
  });
  const size = Math.max(1, Math.round(Math.min(area.width, area.height)));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 不可用');
  }
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出失败'))), 'image/png'),
  );
  return new File([blob], 'avatar.png', { type: 'image/png' });
}

/** 头像裁剪弹窗：圆形裁剪框 + 滚轮/滑杆缩放，确认后导出正方形 PNG */
export function AvatarCropperDialog({ file, onConfirm, onClose }: Props) {
  // objectURL 在 effect 内创建/吊销：StrictMode 下 effect 会挂载→清理→再挂载跑两遍，
  // 若用 useMemo 持有 URL，清理遍吊销后不会重建，Cropper 里的 <img> 会指向失效地址而白屏
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setAreaPixels(pixels), []);

  const confirm = async () => {
    if (!imageUrl || !areaPixels || working) return;
    setWorking(true);
    try {
      onConfirm(await cropToSquareFile(imageUrl, areaPixels));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-[10010] flex items-center justify-center" onClick={onClose}>
      <div className="bg-panel rounded-lg shadow-xl w-[320px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main">裁剪头像</div>
        <div className="p-4 flex flex-col items-center gap-3">
          <div className="relative w-full h-64 rounded-md overflow-hidden bg-bg-page">
            {imageUrl && (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                zoomSpeed={0.3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-2 w-full px-1">
            <span className="text-xs text-text-sub flex-shrink-0">缩放</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>
        </div>
        <div className="border-t border-line p-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded border border-line text-text-sub hover:text-text-main">
            取消
          </button>
          <button
            onClick={confirm}
            disabled={working}
            className="px-4 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            {working ? '上传中…' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}
