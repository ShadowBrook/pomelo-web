export type DetailTab = 'info' | 'album' | 'voice';

interface Props {
  isGroup: boolean;
  isFriend: boolean;
  tab: DetailTab;
  onChange: (t: DetailTab) => void;
}

/** 详情栏页签：长在聊天窗头部蓝条右端（宽 260 对齐详情栏），白底激活页签样式 */
export function DetailTabs({ isGroup, isFriend, tab, onChange }: Props) {
  if (isGroup) {
    return (
      <div className="w-[260px] flex-shrink-0 flex items-end h-full">
        <div className="h-8 px-4 flex items-center bg-panel rounded-t-md text-xs font-medium text-text-main">群组信息</div>
      </div>
    );
  }
  const infoLabel = isFriend ? '好友信息' : '对方信息';
  const tabs: Array<{ key: DetailTab; label: string }> = [
    { key: 'info', label: infoLabel },
    { key: 'album', label: '对方相册' },
    { key: 'voice', label: '语音介绍' },
  ];
  return (
    <div className="w-[260px] flex-shrink-0 flex items-end h-full">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`h-8 px-3 flex items-center text-xs rounded-t-md transition-colors ${
            tab === t.key ? 'bg-panel font-medium text-text-main' : 'text-white/85 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
