import { useState, useRef, KeyboardEvent, useEffect, lazy, Suspense } from 'react';

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
}: Props) {
  const [text, setText] = useState(draft || '');
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
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
    <div className="bg-white border-t border-gray-200 p-3">
      {/* 工具栏 */}
      <div className="flex gap-3 mb-2 text-xl">
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
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
      <input ref={emojiInputRef} type="file" accept="image/*" className="hidden" onChange={handleEmojiSelect} />
    </div>
  );
}
