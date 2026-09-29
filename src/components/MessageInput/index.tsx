import { useState, useRef, KeyboardEvent, useEffect, lazy, Suspense, ReactNode } from 'react';
import { recordedVoiceMime, voiceExt } from '@/utils/voice';

const EmojiPicker = lazy(() => import('@/components/EmojiPicker'));

interface ReplyPreview {
  senderName: string;
  snippet: string;
}

interface Props {
  replyPreview?: ReplyPreview;
  onCancelReply?: () => void;
  peerId: string;
  /** 只读会话（如已被移出群聊）：禁用输入与所有发送入口 */
  disabled?: boolean;
  draft?: string;
  onSendText: (text: string, mentionIds?: string[]) => void;
  onSendImage: (file: File) => void;
  onSendFile: (file: File) => void;
  onSendVoice: (file: File, duration?: number) => void;
  onSendVideo: (file: File) => void;
  onSendEmoji: (file: File) => void;
  onDraftChange: (text: string) => void;
  quickReplies?: string[];
  /** 群成员（仅群聊传入）：@ 按钮弹出成员选择 */
  members?: Array<{ userId: string; nickname: string; userName: string }>;
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 text-text-sub hover:text-text-main transition-colors">
      {children}
    </button>
  );
}

/** 录音波形柱高（固定形状即可：播放条要按消息稳定才需要种子伪随机） */
const RECORD_WAVE_BARS = [0.35, 0.75, 0.45, 1, 0.5, 0.85, 0.4, 0.65, 0.95, 0.55];

/**
 * 录音中的提示条：红色波形 + 文案，代替原来的麦克风 emoji。
 * 与播放态区分：录音态纯红色、节奏 0.75s、幅度 0.2~1；播放态蓝灰两色、1s、0.45~1。
 */
export function RecordingIndicator() {
  return (
    <div className="mb-2 text-xs text-danger flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-danger animate-pulse flex-shrink-0" />
      <span
        className="voice-wave-recording flex items-end gap-[2px] h-4 flex-shrink-0"
        data-testid="recording-wave"
        aria-hidden="true"
      >
        {RECORD_WAVE_BARS.map((height, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-danger flex-shrink-0"
            style={{ height: `${Math.round(height * 100)}%`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </span>
      录音中，点击停止并发送
    </div>
  );
}

export function MessageInput({
  replyPreview,
  onCancelReply,
  peerId,
  disabled = false,
  members,
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

  // @ 提及：mention.start 指向 '@' 后第一个字符；非空即弹出候选下拉
  const [mention, setMention] = useState<{ start: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  // 选中的被 @ 用户 ID（随消息作为 ext.mentioned_user_ids 元数据发送）
  const mentionIdsRef = useRef<string[]>([]);

  // 输入 '@'（行首或空白后）触发；查询词出现空白、删除到 '@' 前、或光标移开提及段即关闭
  const syncMention = (value: string, caret: number) => {
    if (!members || members.length === 0 || disabled) {
      setMention(null);
      return;
    }
    const at = value.lastIndexOf('@', Math.max(0, caret - 1));
    if (at === -1 || caret <= at || /\s/.test(value.slice(at + 1, caret)) || (at > 0 && !/\s/.test(value[at - 1]))) {
      setMention(null);
      return;
    }
    setMention((prev) => (prev && prev.start === at + 1 ? prev : { start: at + 1 }));
    setMentionIndex(0);
  };

  const mentionQuery = mention ? text.slice(mention.start, textareaRef.current?.selectionStart ?? text.length) : '';
  const mentionCandidates = (members ?? []).filter((m) => {
    const name = (m.nickname || m.userName).toLowerCase();
    return !mentionQuery || name.includes(mentionQuery.toLowerCase());
  });

  /** 选中候选：把 '@查询词' 替换为 '@昵称 '，光标落到其后 */
  const pickMention = (member: { userId: string; nickname: string; userName: string }) => {
    const el = textareaRef.current;
    const name = member.nickname || member.userName;
    if (!mentionIdsRef.current.includes(member.userId)) {
      mentionIdsRef.current.push(member.userId);
    }
    const caret = el?.selectionStart ?? text.length;
    const at = (mention?.start ?? caret) - 1;
    const next = text.slice(0, at) + `@${name} ` + text.slice(caret);
    const pos = at + name.length + 2;
    setText(next);
    onDraftChange(next);
    setMention(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  /** 工具栏 @ 按钮：在光标处插入 '@' 并打开下拉 */
  const openMention = () => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const next = text.slice(0, caret) + '@' + text.slice(caret);
    setText(next);
    onDraftChange(next);
    setMention({ start: caret + 1 });
    setMentionIndex(0);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret + 1, caret + 1);
    });
  };
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
      // 仅在确有录音在途时标记丢弃：StrictMode 会在挂载时多跑一次清理，
      // 无条件置位会让本次挂载后的第一条录音被静默丢弃
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        discardVoiceRef.current = true;
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
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const mentionIds = mentionIdsRef.current;
    mentionIdsRef.current = [];
    onSendText(trimmed, mentionIds.length > 0 ? mentionIds : undefined);
    setText('');
    onDraftChange('');
    setMention(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // @ 提及下拉打开时：↑/↓ 移动高亮，Enter/Tab 选中，Esc 关闭（优先于发送）
    if (mention && mentionCandidates.length > 0) {
      const idx = mentionIndex % mentionCandidates.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(e.key === 'ArrowDown' ? idx + 1 : idx + mentionCandidates.length - 1);
        return;
      }
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        pickMention(mentionCandidates[idx]);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        pickMention(mentionCandidates[idx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
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
    syncMention(value, textareaRef.current?.selectionStart ?? value.length);
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
    if (disabled) return;
    if (recording) {
      stopRecording();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
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
        // 实际容器以数据块为准：start() 前 mimeType 为空，硬编码回退会把 Safari 的
        // MP4/AAC 标成 audio/webm，导致 Safari 播放自己录的语音时报「错误」
        const mime = recordedVoiceMime(chunksRef.current[0]?.type, recorder.mimeType);
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
    <div className="bg-panel border-t border-line px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* 工具栏：参考图 8 图标 + 麦克风（保留录音能力）；只读会话整体 inert */}
      <div className={`flex items-center gap-1 mb-1.5 ${disabled ? 'opacity-40' : ''}`} inert={disabled}>
        <div className="relative">
          <ToolButton title="表情" onClick={() => setShowEmoji((v) => !v)}>
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" strokeLinecap="round" />
              <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" /><circle cx="15" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </ToolButton>
          {showEmoji && (
            <Suspense fallback={<div className="absolute bottom-full left-0 mb-2 w-[280px] max-w-[calc(100vw-1.5rem)] h-[200px] bg-white border rounded-lg animate-pulse" />}>
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
        <ToolButton title="@成员" onClick={openMention}>
          <span className="text-[15px] leading-none font-medium">@</span>
        </ToolButton>
        <ToolButton title={recording ? '停止录音' : '语音输入'} onClick={toggleRecord}>
          <svg viewBox="0 0 24 24" className={`w-[18px] h-[18px] ${recording ? 'text-danger animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
          </svg>
        </ToolButton>
      </div>

      {/* 引用条 */}
      {replyPreview && (
        <div className="mb-1.5 flex items-center gap-2 bg-black/5 rounded px-2 py-1">
          <div className="min-w-0 flex-1 text-xs">
            <span className="text-primary">回复 {replyPreview.senderName}：</span>
            <span className="text-text-sub">{replyPreview.snippet}</span>
          </div>
          <button className="text-text-sub hover:text-text-main text-sm leading-none px-1" title="取消引用" onClick={onCancelReply}>×</button>
        </div>
      )}

      {/* 录音提示条 */}
      {recording && <RecordingIndicator />}

      {/* @ 成员选择弹层：输入 '@' 后按查询词过滤，↑/↓ 选择、Enter/Tab 确认 */}
      {mention && !disabled && (
        <div className="relative">
          <div className="absolute bottom-3 left-12 bg-panel rounded-md shadow-xl border border-line py-1 w-[220px] max-h-[220px] overflow-y-auto z-20">
            {mentionCandidates.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-sub">无匹配成员</div>
            ) : (
              mentionCandidates.map((m, i) => (
                <button
                  key={m.userId}
                  // mousedown 先于 textarea blur，避免点击项前弹层被失焦关闭
                  onMouseDown={(e) => { e.preventDefault(); pickMention(m); }}
                  className={`w-full text-left px-3 py-1.5 text-sm truncate transition-colors ${
                    i === mentionIndex % mentionCandidates.length ? 'bg-bg-page text-primary' : 'text-text-main hover:bg-bg-page'
                  }`}
                >
                  {m.nickname || m.userName}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 输入区域（无边框，白底透明输入） */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={() => syncMention(text, textareaRef.current?.selectionStart ?? text.length)}
        disabled={disabled}
        placeholder={disabled ? '你已被移出群聊，无法发送消息' : '输入聊天信息，按 Enter 键快速发送 ...'}
        rows={3}
        className="w-full resize-none bg-transparent px-1 py-1 text-sm text-text-main focus:outline-none disabled:cursor-not-allowed"
      />

      {/* 底行：右对齐提示 + 发送组合按钮 */}
      <div className="flex items-center justify-end gap-2 mt-1">
        <span className="text-[11px] text-text-sub">按 Ctrl+Enter 换行，按 Enter 发送</span>
        <div className="relative flex">
          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
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
