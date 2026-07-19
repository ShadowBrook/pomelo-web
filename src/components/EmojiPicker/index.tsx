const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
  '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
  '😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔',
  '😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶',
  '👍','👎','👌','✌️','🤞','🤟','🤘','👊','✊','🤛',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
  '🎉','🎊','🎈','🎁','🎀','🏆','🥇','🌟','⭐','✨',
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-[280px] z-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">表情</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
        {EMOJI_LIST.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(emoji)}
            className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
