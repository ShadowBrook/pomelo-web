import { useState, useRef, KeyboardEvent, useEffect, lazy, Suspense } from 'react';

const EmojiPicker = lazy(() => import('@/components/EmojiPicker'));

interface Props {
  peerId: string;
  draft?: string;
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  onSendFile: (file: File) => void;
  onDraftChange: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ peerId, draft, onSendText, onSendImage, onSendFile, onDraftChange, disabled }: Props) {
  const [text, setText] = useState(draft || '');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(draft || '');
  }, [peerId, draft]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendText(trimmed);
    setText('');
    onDraftChange('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    onDraftChange(value);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendImage(file);
      e.target.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3">
      {/* 工具栏 */}
      <div className="flex gap-3 mb-2 text-xl">
        <button onClick={() => imageInputRef.current?.click()} className="hover:opacity-70 transition-opacity" title="发送图片">
          🖼️
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="hover:opacity-70 transition-opacity" title="发送文件">
          📎
        </button>
        <div className="relative">
          <button onClick={() => setShowEmoji(!showEmoji)} className="hover:opacity-70 transition-opacity" title="表情">
            😊
          </button>
          {showEmoji && (
            <Suspense fallback={<div className="absolute bottom-full left-0 mb-2 w-[280px] h-[200px] bg-white border rounded-lg animate-pulse" />}>
              <EmojiPicker
                onSelect={(emoji) => {
                  setText(prev => prev + emoji);
                  setShowEmoji(false);
                  textareaRef.current?.focus();
                }}
                onClose={() => setShowEmoji(false)}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={disabled}
          rows={3}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wechat-green disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="px-5 py-2 bg-wechat-green text-white rounded-lg text-sm font-medium hover:bg-wechat-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          发送
        </button>
      </div>

      {/* 隐藏的文件 input */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
    </div>
  );
}
