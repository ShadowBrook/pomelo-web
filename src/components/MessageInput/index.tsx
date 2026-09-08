import { useState, useRef, KeyboardEvent, useEffect, lazy, Suspense, ReactNode } from 'react';
import { toast } from '@/stores/useToastStore';

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
  quickReplies?: string[];
}

/** MediaRecorder MIME → 扩展名（Chrome 默认 webm，Safari 为 mp4/m4a） */
function voiceExt(mime: string): string {
  const base = (mime || '').split(';')[0].toLowerCase();
  if (base.includes('mp4')) return 'm4a';
  if (base.includes('ogg')) return 'ogg';
  return 'webm';
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 text-text-sub hover:text-text-main transition-colors">
      {children}
    </button>
  );
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
    if (!trimmed) return;
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
    <div className="bg-panel border-t border-line px-3 pt-2 pb-2">
      {/* 工具栏：参考图 8 图标 + 麦克风（保留录音能力） */}
      <div className="flex items-center gap-1 mb-1.5">
        <div className="relative">
          <ToolButton title="表情" onClick={() => setShowEmoji((v) => !v)}>
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" strokeLinecap="round" />
              <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" /><circle cx="15" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </ToolButton>
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
        <ToolButton title="发送文件" onClick={() => fileInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </svg>
        </ToolButton>
        <ToolButton title="发送图片" onClick={() => imageInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 18l5-5 3 3 4-4 4 4" />
          </svg>
        </ToolButton>
        <ToolButton title="发送视频" onClick={() => videoInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="2.5" y="5" width="13" height="14" rx="2" /><path d="M15.5 10.5L21 7v10l-5.5-3.5z" />
          </svg>
        </ToolButton>
        <ToolButton title="个人名片" onClick={() => toast('功能开发中')}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="8" r="3.5" /><path d="M5 20c.9-3.2 3.7-5 7-5s6.1 1.8 7 5" />
          </svg>
        </ToolButton>
        <ToolButton title="群名片" onClick={() => toast('功能开发中')}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="9" cy="8.5" r="3" /><circle cx="16.5" cy="9.5" r="2.4" />
            <path d="M3.5 19.5c.7-2.8 2.9-4.5 5.5-4.5s4.8 1.7 5.5 4.5M15 15.3c1.9.2 3.4 1.5 4 3.7" />
          </svg>
        </ToolButton>
        <ToolButton title="位置" onClick={() => toast('功能开发中')}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
          </svg>
        </ToolButton>
        <ToolButton title="@" onClick={() => toast('功能开发中')}>
          <span className="text-[15px] leading-none font-medium">@</span>
        </ToolButton>
        <ToolButton title="清屏" onClick={() => toast('功能开发中')}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M4 20h16M9 15l9-9a2.1 2.1 0 0 0-3-3l-9 9v3h3z" />
          </svg>
        </ToolButton>
        <ToolButton title={recording ? '停止录音' : '语音输入'} onClick={toggleRecord}>
          <svg viewBox="0 0 24 24" className={`w-[18px] h-[18px] ${recording ? 'text-danger animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
          </svg>
        </ToolButton>
      </div>

      {/* 录音提示条 */}
      {recording && (
        <div className="mb-2 text-xs text-red-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          录音中，点击 🎤 停止并发送
        </div>
      )}

      {/* 输入区域（无边框，白底透明输入） */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入聊天信息，按 Enter 键快速发送 ..."
        rows={3}
        className="w-full resize-none bg-transparent px-1 py-1 text-sm text-text-main focus:outline-none"
      />

      {/* 底行：右对齐提示 + 发送组合按钮 */}
      <div className="flex items-center justify-end gap-2 mt-1">
        <span className="text-[11px] text-text-sub">按 Ctrl+Enter 换行，按 Enter 发送</span>
        <div className="relative flex">
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-5 py-1.5 bg-send-btn text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 rounded-l-sm transition-opacity"
          >
            发送
          </button>
          <button
            onClick={() => setShowQuick((v) => !v)}
            title="快捷回复"
            className="px-2 py-1.5 bg-primary-dark text-white text-xs hover:opacity-90 border-l border-white/25 rounded-r-sm transition-opacity"
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

      {/* 隐藏的文件 input */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
      <input ref={emojiInputRef} type="file" accept="image/*" className="hidden" onChange={handleEmojiSelect} />
    </div>
  );
}
