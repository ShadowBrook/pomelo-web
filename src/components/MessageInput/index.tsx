import { useState, useRef, KeyboardEvent, useEffect, lazy, Suspense, ReactNode } from 'react';

const EmojiPicker = lazy(() => import('@/components/EmojiPicker'));

interface Props {
  peerId: string;
  draft?: string;
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  onSendFile: (file: File) => void;
  onSendVoice: (file: File, duration?: number) => void;
  onSendVideo: (file: File) => void;
  onSendEmoji: (file: File) => void;
  onDraftChange: (text: string) => void;
  disabled?: boolean;
  statusNode?: ReactNode;
  quickReplies?: string[];
}

/** MediaRecorder MIME → 扩展名（Chrome 默认 webm，Safari 为 mp4/m4a） */
function voiceExt(mime: string): string {
  const base = (mime || '').split(';')[0].toLowerCase();
  if (base.includes('mp4')) return 'm4a';
  if (base.includes('ogg')) return 'ogg';
  return 'webm';
}

export function MessageInput({
  peerId,
  draft,
  onSendText,
  onSendImage,
  onSendFile,
  onSendVoice,
  onSendVideo,
  onSendEmoji,
  onDraftChange,
  disabled,
  statusNode,
  quickReplies = ['正在处理紧急事情', '有事先离开一会儿'],
}: Props) {
  const [text, setText] = useState(draft || '');
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const emojiInputRef = useRef<HTMLInputElement>(null);

  // 录音状态
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  // 卸载/切换会话时丢弃录音，避免把语音发到错误的会话
  const discardVoiceRef = useRef(false);

  // 切换会话/卸载时停止录音，避免残留录音流
  useEffect(() => {
    return () => {
      discardVoiceRef.current = true;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [peerId]);

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
    // Ctrl/Cmd+Enter：插入换行（参考产品行为）
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const next = text + '\n';
      setText(next);
      onDraftChange(next);
      return;
    }
    // IME 组合态（中文输入法等）时 Enter 用于确认候选词，不发送消息
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
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

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendVideo(file);
      e.target.value = '';
    }
  };

  const handleEmojiSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendEmoji(file);
      e.target.value = '';
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const toggleRecord = async () => {
    if (recording) {
      stopRecording();
      return;
    }
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const mime = recorder.mimeType || 'audio/webm';
      chunksRef.current = [];
      recordStartRef.current = Date.now();
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const discard = discardVoiceRef.current;
        const duration = Date.now() - recordStartRef.current;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setRecording(false);
        discardVoiceRef.current = false;
        if (discard) return;
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size > 0) {
          const file = new File([blob], `voice-${Date.now()}.${voiceExt(mime)}`, { type: mime });
          onSendVoice(file, duration);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      console.error('录音失败:', e);
      alert('无法访问麦克风，请检查权限');
    }
  };

  return (
    <div className="bg-bg-page border-t border-line px-3 pt-2 pb-2">
      {/* 工具栏 */}
      <div className="flex gap-3 mb-2 text-lg">
        <button onClick={() => imageInputRef.current?.click()} disabled={disabled} className="hover:opacity-70 transition-opacity disabled:opacity-40" title="发送图片">
          🖼️
        </button>
        <button onClick={() => fileInputRef.current?.click()} disabled={disabled} className="hover:opacity-70 transition-opacity disabled:opacity-40" title="发送文件">
          📎
        </button>
        {/* 录音中保持可点击，用于停止并发送（即使期间断线） */}
        <button
          onClick={toggleRecord}
          disabled={disabled && !recording}
          className={`hover:opacity-70 transition-opacity disabled:opacity-40 ${recording ? 'text-red-500 animate-pulse' : ''}`}
          title={recording ? '停止录音' : '语音'}
        >
          {recording ? '●' : '🎤'}
        </button>
        <button onClick={() => videoInputRef.current?.click()} disabled={disabled} className="hover:opacity-70 transition-opacity disabled:opacity-40" title="发送视频">
          🎬
        </button>
        <div className="relative">
          <button onClick={() => setShowEmoji(!showEmoji)} disabled={disabled} className="hover:opacity-70 transition-opacity disabled:opacity-40" title="表情">
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
                onCustomEmoji={() => {
                  emojiInputRef.current?.click();
                  setShowEmoji(false);
                }}
                onClose={() => setShowEmoji(false)}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* 录音提示条 */}
      {recording && (
        <div className="mb-2 text-xs text-red-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          录音中，点击 🎤 停止并发送
        </div>
      )}

      {/* 输入区域（无边框，参考图样式） */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入聊天信息，按 Enter 键快速发送 ..."
        disabled={disabled}
        rows={3}
        className="w-full resize-none bg-transparent px-1 py-1 text-sm text-text-main focus:outline-none disabled:opacity-50"
      />

      {/* 底行：左=连接状态；右=快捷提示+组合发送按钮 */}
      <div className="flex items-center justify-between mt-1">
        <div className="text-xs flex-1 min-w-0 truncate">{statusNode}</div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-text-sub">按 Ctrl+Enter 换行，按 Enter 发送</span>
          <div className="relative flex">
            <button
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              className="px-4 py-1.5 bg-primary text-white rounded-l-md text-xs font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              发送
            </button>
            <button
              onClick={() => setShowQuick(!showQuick)}
              disabled={disabled}
              title="快捷回复"
              className="px-2 py-1.5 bg-primary text-white rounded-r-md text-xs hover:bg-primary-dark border-l border-white/25 disabled:opacity-50 transition-colors"
            >
              ▼
            </button>
            {showQuick && (
              <div className="absolute bottom-full right-0 mb-2 bg-panel rounded-md shadow-xl border border-line py-1 w-[220px] z-20">
                {quickReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => {
                      onSendText(qr);
                      setShowQuick(false);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-bg-page transition-colors"
                  >
                    快捷回复："{qr}"
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 隐藏的文件 input */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
      <input ref={emojiInputRef} type="file" accept="image/*" className="hidden" onChange={handleEmojiSelect} />
    </div>
  );
}
