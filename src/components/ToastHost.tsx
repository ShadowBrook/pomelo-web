import { useToastStore } from '@/stores/useToastStore';

/** 黑方块 toast（参考 3_setups「提示音已开」），右下角堆叠 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-8 right-8 z-[10001] flex flex-col gap-2 items-center">
      {toasts.map((t) => (
        <div key={t.id} className="min-w-[96px] max-w-[280px] px-4 py-3 rounded-lg bg-[#3a3f45] text-white text-xs text-center shadow-xl">
          {t.message}
        </div>
      ))}
    </div>
  );
}
