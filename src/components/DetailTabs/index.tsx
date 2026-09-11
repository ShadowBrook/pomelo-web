/** 详情栏标签文案：好友信息 / 对方信息 / 群组信息 */
export function detailLabel(isGroup: boolean, isFriend: boolean) {
  return isGroup ? '群组信息' : isFriend ? '好友信息' : '对方信息';
}

interface Props {
  label: string;
  onToggle: () => void;
}

/** 详情栏头部条：贴在面板顶部（不再嵌在聊天窗蓝条里），点击整条可收起 */
export function DetailTabs({ label, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-expanded
      title={`收起${label}`}
      className="h-8 flex-shrink-0 w-full flex items-center justify-between px-3 border-b border-line bg-panel text-xs font-medium text-text-main hover:text-primary transition-colors"
    >
      <span>{label}</span>
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
