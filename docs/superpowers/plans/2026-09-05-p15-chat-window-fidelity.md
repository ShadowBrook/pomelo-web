# P1.5 聊天窗结构复刻精修实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按参考截图复刻聊天窗三区结构（双段标题栏 + 左聊天区 + 右详情栏），并精修主面板（图标 tab/统计行/陌标），修正我方气泡为浅蓝底深字。

**Architecture:** `DraggableWindow` 增加头部插槽（`headerContent`/`extraHeaderButtons`/`barClassName`）支持双段标题栏；新增 `ChatWindowHeader`（用户卡+对象名+声音开关+简版个人信息弹窗）与 `ChatDetailPanel`（对方信息/对方相册/语音介绍三 tab）两个组件；`MessageInput` 底部区重构（组合发送按钮/快捷回复/Ctrl+Enter/状态槽）；`ChatWindowContent` 重排为左右两栏；主面板图标化 tab + 统计行 + 陌标。

**Tech Stack:** React 19 + TS(strict) + Tailwind 4 tokens + Zustand 5 + Vitest

**Spec:** `docs/superpowers/specs/2026-09-04-web-im-redesign-design.md` §12（P1.5，2026-09-05 增补）

## Global Constraints

- 延续 P1 约束：`useIMClient()` 只在 `src/pages/Chat/index.tsx` 调用；颜色只用 `@theme` token 类；不新增 npm 依赖；store 回调用 `getState()`
- `npm run lint` 不可用（预存），验证 = `npm test && npm run build`（tsc strict 含测试文件——测试代码不得有未使用变量）
- 气泡新值（verbatim）：`--color-bubble-self: #D9E8FF`（浅蓝底深字），`.bubble-self::after` 的 `border-left-color: #D9E8FF`
- 数据边界：auth user 无签名字段 → 凡涉及"我的签名"的位置直接不渲染签名行；`getProfile` 返回 `{userId, userName, nickname, avatar, status}`，无邮箱/注册时间/最近登陆/IP → 对方信息这些行显示 `—`
- FriendStore 可用 API（verbatim）：`sendFriendRequest(userId, friendId): Promise<{success, message}>`、`removeFriend(userId, friendId): Promise<{success, message}>`、`friends: Friend[]`（`{userId, userName, nickname, avatar, online, friendedAt}`）
- 分支：`feat/web-im-redesign`（在 P1 之上继续）

---

### Task 1: 气泡 token 修正

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: `--color-bubble-self: #D9E8FF`（MessageBubble 的 `bg-bubble-self` + `text-text-main` 自动变为浅蓝底深字，无需改 MessageBubble）

- [ ] **Step 1: 修改 `src/index.css`**

`@theme` 中 `--color-bubble-self: #2E6BE6;` 改为：

```css
  --color-bubble-self: #D9E8FF;
```

`.bubble-self::after` 中 `border-left-color: #2E6BE6;` 改为：

```css
  border-left-color: #D9E8FF;
```

- [ ] **Step 2: 验证**

Run: `grep -n "D9E8FF" src/index.css`
Expected: 两处（token + 箭头）。再 `npm test && npm run build` 全绿。

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: 我方气泡修正为浅蓝底深字（参考图一致）"
```

---

### Task 2: DraggableWindow 头部插槽 + ChatWindowHeader 双段标题栏

**Files:**
- Modify: `src/components/window/DraggableWindow.tsx`
- Create: `src/components/ChatWindowHeader/index.tsx`
- Modify: `src/components/window/WindowLayer.tsx`（ChatWindow 接入）

**Interfaces:**
- Consumes: `WinInfo`/`useWindowStore`（P1）；`useAuthStore.user: {userId, userName, nickname, avatar} | null`；`useConversationStore.conversations[peerId]: {nickname, type, ...}`；`useFriendStore.friends: Friend[]`
- Produces:
  - `DraggableWindow` 新增可选 props：`headerContent?: ReactNode`（提供时替换默认标题文本，标题栏去掉默认 `px-3` 内边距，由内容自管）、`extraHeaderButtons?: ReactNode`（渲染在 ⛶/✕ 之前）、`barClassName?: string`（追加到标题栏，默认 `''`）
  - `<ChatWindowHeader peerId={string} />`：双段标题栏内容 + 🔊/🔇 视觉开关（本地 state）+ ⚙ 打开简版"我的个人信息"弹窗
  - WindowLayer 的 ChatWindow：`height={560}`、`headerContent={<ChatWindowHeader peerId={peerId} />}`、`barClassName="h-12"`（主面板窗保持 h-10 现状）

- [ ] **Step 1: DraggableWindow 增加三个可选 props**

接口改为：

```tsx
interface Props {
  win: WinInfo;
  width: number;
  height: number;
  title: ReactNode;
  children: ReactNode;
  /** 提供时替换默认标题文本（标题栏去默认内边距，内容自管布局） */
  headerContent?: ReactNode;
  /** 渲染在 ⛶/✕ 之前的额外标题栏按钮 */
  extraHeaderButtons?: ReactNode;
  /** 追加到标题栏的类（如 h-12） */
  barClassName?: string;
}

export function DraggableWindow({ win, width, height, title, children, headerContent, extraHeaderButtons, barClassName }: Props) {
```

标题栏 div 改为（`h-10` → `h-10 ${barClassName ?? ''}`，内边距条件化）：

```tsx
      <div
        className={`h-10 flex items-center justify-between flex-shrink-0 select-none bg-gradient-to-b from-titlebar-from to-titlebar-to ${barClassName ?? ''} ${headerContent ? '' : 'px-3'}`}
        onPointerDown={onPointerDown}
        onDoubleClick={() => toggleFullscreen(win.id)}
      >
        {headerContent ?? <div className="text-sm font-medium text-white truncate px-3">{title}</div>}
        <div className="flex items-center gap-1 pr-2">
          {extraHeaderButtons}
          <button
            onClick={() => toggleFullscreen(win.id)}
            title={win.fullscreen ? '还原' : '全屏'}
            className="w-6 h-6 rounded text-white/90 hover:bg-white/20 text-xs"
          >
            {win.fullscreen ? '❐' : '⛶'}
          </button>
          <button
            onClick={() => close(win.id)}
            title="关闭"
            className="w-6 h-6 rounded text-white/90 hover:bg-danger text-xs"
          >
            ✕
          </button>
        </div>
      </div>
```

- [ ] **Step 2: 实现 `src/components/ChatWindowHeader/index.tsx`**

```tsx
import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';

/**
 * 聊天窗双段标题栏：左段=当前登录用户卡（头像/昵称/⚙），右段=对方名+标签。
 * 声音开关为视觉开关（实际通知音实现见 spec §12.3）；auth user 无签名字段，签名行不渲染。
 */
export function ChatWindowHeader({ peerId }: { peerId: string }) {
  const user = useAuthStore((s) => s.user);
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const [soundOn, setSoundOn] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const isGroup = conversation?.type === 'group';
  const isStranger = !isGroup && !friend;

  return (
    <div className="flex items-stretch h-12 min-w-0 flex-1">
      {/* 左段：当前用户卡 */}
      <div className="flex items-center gap-2 px-3 bg-titlebar-to flex-shrink-0">
        {user?.avatar ? (
          <img src={user.avatar} alt="me" className="w-8 h-8 rounded object-cover" />
        ) : (
          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-white text-xs">
            {user?.nickname?.charAt(0).toUpperCase() || '我'}
          </div>
        )}
        <span className="text-sm font-medium text-white truncate max-w-[120px]">{user?.nickname || '我'}</span>
        <button
          onClick={() => setShowProfile(true)}
          title="我的个人信息"
          className="w-6 h-6 rounded text-white/80 hover:text-white hover:bg-white/20 text-sm"
        >
          ⚙
        </button>
      </div>

      {/* 右段：对方名 + 标签（剩余宽度留给窗口控制钮） */}
      <div className="flex items-center gap-2 px-3 min-w-0 flex-1">
        <span className="text-sm font-medium text-white truncate">{conversation?.nickname ?? peerId}</span>
        {isGroup && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-white/20 text-white flex-shrink-0">群聊</span>}
        {isStranger && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-warn text-white flex-shrink-0">陌生人</span>}
      </div>

      {/* 简版"我的个人信息"弹窗 */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setShowProfile(false)}>
          <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main flex items-center justify-between">
              我的个人信息
              <button onClick={() => setShowProfile(false)} className="text-text-sub hover:text-text-main text-base leading-none">✕</button>
            </div>
            <div className="p-4 flex flex-col items-center gap-2">
              {user?.avatar ? (
                <img src={user.avatar} alt="me" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary text-white flex items-center justify-center text-xl">
                  {user?.nickname?.charAt(0).toUpperCase() || '我'}
                </div>
              )}
              <span className="text-sm font-medium text-text-main">{user?.nickname}</span>
              <span className="text-xs text-text-sub">ID号：{user?.userId}</span>
            </div>
            <div className="border-t border-line p-3 text-right">
              <button onClick={() => setShowProfile(false)} className="px-4 py-1.5 text-sm rounded bg-panel border border-line text-text-sub hover:text-text-main">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: WindowLayer 的 ChatWindow 接入**

`src/components/window/WindowLayer.tsx`：`CHAT_H` 常量 `540` → `560`；ChatWindow 的 DraggableWindow 增加 props（title 保留为空字符串兜底）：

```tsx
    <DraggableWindow
      win={win}
      width={CHAT_W}
      height={CHAT_H}
      title=""
      barClassName="h-12"
      headerContent={<ChatWindowHeader peerId={peerId} />}
      …（原 isGroup/memberCount 的 title JSX 删除，成员数展示由 ChatDetailPanel 承担）
    >
```

导入：`import { ChatWindowHeader } from '@/components/ChatWindowHeader';`。原 `memberCount` selector 与群标签 JSX 一并删除（不再被引用）。

- [ ] **Step 4: 验证 + Commit**

Run: `npm test && npm run build`
Expected: 全绿

```bash
git add src/components/window/DraggableWindow.tsx src/components/ChatWindowHeader src/components/window/WindowLayer.tsx
git commit -m "feat: 聊天窗双段标题栏（当前用户卡+对象名标签）与头部插槽"
```

---

### Task 3: ChatDetailPanel 右栏三 tab

**Files:**
- Create: `src/components/ChatDetailPanel/index.tsx`

**Interfaces:**
- Consumes: `useFriendStore.friends`/`sendFriendRequest(userId, friendId)`/`removeFriend(userId, friendId)`；`useGroupStore.groups`/`groupMembers`；`useAuthStore.user`；`getProfile(userId): Promise<{code, data?: {userId, userName, nickname, avatar, status}}>`（`@/utils/api`）；`getIMClient()`（加为好友兜底不需要——sendFriendRequest 已封装）
- Produces: `<ChatDetailPanel peerId={string} isGroup={boolean} />`（Task 5 接入）

- [ ] **Step 1: 实现 `src/components/ChatDetailPanel/index.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { getProfile } from '@/utils/api';

interface Props {
  peerId: string;
  isGroup: boolean;
}

type Tab = 'info' | 'album' | 'voice';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'info', label: '对方信息' },
  { key: 'album', label: '对方相册' },
  { key: 'voice', label: '语音介绍' },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-xs leading-6">
      <span className="w-16 text-text-sub flex-shrink-0">{label}：</span>
      <span className="text-text-main break-all">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-sub">
      <span className="text-3xl opacity-40">🗂</span>
      <span className="text-xs">{text}</span>
    </div>
  );
}

export function ChatDetailPanel({ peerId, isGroup }: Props) {
  const user = useAuthStore((s) => s.user);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const group = useGroupStore((s) => s.groups[peerId]);
  const memberCount = useGroupStore((s) => s.groupMembers[peerId]?.length);
  const [tab, setTab] = useState<Tab>('info');
  // 陌生人资料兜底（好友数据缺头像/昵称时也拉一次）
  const [profile, setProfile] = useState<{ nickname: string; avatar: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isGroup && !friend) {
      getProfile(peerId)
        .then((res) => {
          if (!cancelled && res.data) setProfile({ nickname: res.data.nickname, avatar: res.data.avatar });
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [peerId, isGroup, friend]);

  const displayName = isGroup
    ? group?.name ?? peerId
    : friend?.nickname ?? profile?.nickname ?? peerId;
  const displayAvatar = isGroup ? '' : friend?.avatar ?? profile?.avatar ?? '';

  const tabBtn = (key: Tab, label: string) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`flex-1 py-2.5 text-xs transition-colors ${
        tab === key ? 'text-primary font-medium border-b-2 border-primary' : 'text-text-sub hover:text-text-main'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-[260px] flex-shrink-0 border-l border-line bg-panel flex flex-col min-h-0">
      {/* Tab 头：群聊只有"群组信息"一个 tab；单聊三个 tab */}
      <div className="flex border-b border-line flex-shrink-0">
        {isGroup ? (
          <button className="flex-1 py-2.5 text-xs text-primary font-medium border-b-2 border-primary">群组信息</button>
        ) : (
          TABS.map((t) => tabBtn(t.key, t.label))
        )}
      </div>

      {tab === 'info' && (
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="flex flex-col items-center gap-1.5 px-4 pt-5 pb-3">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-text-main">{displayName}</span>
            {!isGroup && !friend && <span className="text-[11px] px-1.5 rounded-sm bg-warn text-white">陌生人</span>}
          </div>

          {isGroup ? (
            <div className="px-5 pb-4">
              <div className="text-xs font-medium text-text-main mb-1">基本信息</div>
              <InfoRow label="群名" value={displayName} />
              <InfoRow label="群ID" value={peerId} />
              <InfoRow label="成员数" value={memberCount != null ? `${memberCount}` : '—'} />
            </div>
          ) : (
            <div className="px-5 pb-4">
              <div className="text-xs font-medium text-text-main mb-1">基本信息</div>
              <InfoRow label="ID号" value={peerId} />
              <InfoRow label="邮箱" value="—" />
              <InfoRow label="注册时间" value="—" />
              <InfoRow label="最近登陆" value="—" />
              <InfoRow label="最近 IP" value="—" />
              {friend && (
                <InfoRow label="成为好友" value={friend.friendedAt ? new Date(friend.friendedAt).toLocaleDateString('zh-CN') : '—'} />
              )}
            </div>
          )}

          {/* 底部操作：好友→删除好友；陌生人→加为好友；群聊无操作 */}
          {!isGroup && user && (
            <div className="mt-auto border-t border-line p-3">
              <FooterAction peerId={peerId} isFriend={!!friend} />
            </div>
          )}
        </div>
      )}

      {tab === 'album' && <EmptyState text="暂无相册" />}
      {tab === 'voice' && <EmptyState text="暂无语音介绍" />}
    </div>
  );
}

function FooterAction({ peerId, isFriend }: { peerId: string; isFriend: boolean }) {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'confirmDelete'>('idle');

  if (!user) return null;

  if (isFriend) {
    if (state !== 'confirmDelete') {
      return (
        <button
          onClick={() => setState('confirmDelete')}
          className="w-full py-1.5 text-xs rounded border border-danger/40 text-danger hover:bg-danger/5"
        >
          删除好友
        </button>
      );
    }
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setState('idle')}
          className="flex-1 py-1.5 text-xs rounded border border-line text-text-sub hover:text-text-main"
        >
          取消
        </button>
        <button
          onClick={async () => {
            const res = await useFriendStore.getState().removeFriend(user.userId, peerId);
            if (res.success) setState('idle');
          }}
          className="flex-1 py-1.5 text-xs rounded bg-danger text-white hover:opacity-90"
        >
          确认删除
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={state === 'sending' || state === 'sent'}
      onClick={async () => {
        setState('sending');
        const res = await useFriendStore.getState().sendFriendRequest(user.userId, peerId);
        setState(res.success ? 'sent' : 'failed');
      }}
      className="w-full py-1.5 text-xs rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
    >
      {state === 'sending' ? '发送中…' : state === 'sent' ? '已发送申请' : state === 'failed' ? '发送失败，点击重试' : '加为好友'}
    </button>
  );
}
```

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run build`
Expected: 全绿（组件暂未被引用）

```bash
git add src/components/ChatDetailPanel
git commit -m "feat: ChatDetailPanel 右栏三 tab（对方信息/相册空态/语音空态）"
```

---

### Task 4: MessageInput 底部区重构

**Files:**
- Modify: `src/components/MessageInput/index.tsx`

**Interfaces:**
- Consumes: 现有 props 不变
- Produces（Task 5 依赖）：新增可选 props `statusNode?: ReactNode`（底行左侧连接状态）、`quickReplies?: string[]`（▼ 菜单，缺省 `['正在处理紧急事情', '有事先离开一会儿']`）；Ctrl+Enter（或 ⌘+Enter）插入换行；占位文案 `输入聊天信息，按 Enter 键快速发送 ...`；底行右侧提示 `按 Ctrl+Enter 换行，按 Enter 发送`；发送按钮为 [发送|▼] 组合

- [ ] **Step 1: 修改 props 与 handleKeyDown**

Props 接口追加两行，并新增 `showQuick` state：

```tsx
import { useState, useRef, KeyboardEvent, useEffect, lazy, Suspense, ReactNode } from 'react';
```

```tsx
interface Props {
  // …原 9 个 props 不变…
  statusNode?: ReactNode;
  quickReplies?: string[];
}
```

组件签名解构追加 `statusNode, quickReplies = ['正在处理紧急事情', '有事先离开一会儿'],`；state 区追加 `const [showQuick, setShowQuick] = useState(false);`

`handleKeyDown` 整体替换为：

```tsx
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
```

- [ ] **Step 2: 重构 return JSX（容器与底行）**

最外层容器改为浅灰底（参考图输入区底色）：

```tsx
    <div className="bg-bg-page border-t border-line px-3 pt-2 pb-2">
```

工具栏行保持原按钮与逻辑不变（仅容器类改为 `flex gap-3 mb-2 text-lg`）。

输入区域 + 底行整体替换为：

```tsx
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
```

注意：原"输入区域 flex 布局 + 独立发送按钮"整段删除；工具栏上方原来的录音提示条保留原位。

- [ ] **Step 3: 验证 + Commit**

Run: `npm test && npm run build`
Expected: 全绿（statusNode 未传时底行左侧为空，兼容现状）

```bash
git add src/components/MessageInput/index.tsx
git commit -m "feat: MessageInput 底部区重构（组合发送/快捷回复/Ctrl+Enter/状态槽）"
```

---

### Task 5: ChatWindowContent 左右两栏布局

**Files:**
- Modify: `src/components/ChatWindowContent/index.tsx`

**Interfaces:**
- Consumes: `ChatDetailPanel`（Task 3）、`MessageInput` 新 props（Task 4）、`useConnStore.state`
- Produces: 聊天窗 = 左聊天区（flex-1）+ 右 `ChatDetailPanel`（260px）

- [ ] **Step 1: 重排 JSX**

在文件顶部追加常量与导入：

```tsx
import { ChatDetailPanel } from '@/components/ChatDetailPanel';

const QUICK_REPLIES = ['正在处理紧急事情', '有事先离开一会儿'];
```

return 的结构改为（ConnectionBanner/MessageList/已读弹窗原样保留；**MessageList 与 MessageInput 的所有现有 props 一律原样保留不动**，仅 MessageInput 按下例追加 `statusNode` 和 `quickReplies` 两个 props）：

```tsx
  return (
    <div className="flex-1 flex min-h-0">
      {/* 左：聊天区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <ConnectionBanner
          state={connState}
          onReconnect={() => useConnStore.getState().requestReconnect()}
        />
        <MessageList /* …原 props 不变… */ />
        <MessageInput
          /* …原 props 不变，追加： */
          statusNode={
            <span className={`flex items-center gap-1 ${connState === 'connected' ? 'text-ok' : 'text-danger'}`}>
              ● {connState === 'connected' ? '通信正常' : connState === 'connecting' ? '连接中' : '通信中断'}
            </span>
          }
          quickReplies={QUICK_REPLIES}
        />
      </div>

      {/* 右：详情栏 */}
      <ChatDetailPanel peerId={peerId} isGroup={s.isGroup} />

      {/* 已读弹窗 …原 JSX 不变… */}
    </div>
  );
```

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run build`
Expected: 全绿

```bash
git add src/components/ChatWindowContent/index.tsx
git commit -m "feat: 聊天窗左右两栏布局（聊天区+详情栏）"
```

---

### Task 6: 主面板精修（图标 tab/统计行/陌标）

**Files:**
- Modify: `src/components/MainPanel/index.tsx`
- Modify: `src/components/ConversationItem/index.tsx`

**Interfaces:**
- Consumes: `useUnreadCount()`（`{totalUnread}`）、`useFriendStore.pendingRequests`、`useFriendStore.friends`
- Produces: ConversationItem 无新 props（内部自算陌标）

- [ ] **Step 1: MainPanel 图标 tab + 统计行**

文件顶部加行内 SVG 图标组件（放在 MainPanel 函数外）：

```tsx
function IconChat({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconBell({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconUsers({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
```

MainPanel 内追加订阅（`useUnreadCount` 导入恢复）：`const { totalUnread } = useUnreadCount();` 与 `const pendingCount = useFriendStore((s) => s.pendingRequests.length);`

Tab 行整体替换为：

```tsx
      {/* Tab 切换（图标式） */}
      <div className="flex border-b border-line bg-panel">
        <button onClick={() => setSidebarTab('chats')} className={`relative flex-1 py-2.5 flex items-center justify-center transition-colors ${sidebarTab === 'chats' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`} title="聊天">
          <IconChat active={sidebarTab === 'chats'} />
        </button>
        <button onClick={() => setSidebarTab('groups')} className={`flex-1 py-2.5 flex items-center justify-center transition-colors ${sidebarTab === 'groups' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`} title="群聊">
          <IconUsers active={sidebarTab === 'groups'} />
        </button>
        <button onClick={() => setSidebarTab('friends')} className={`relative flex-1 py-2.5 flex items-center justify-center transition-colors ${sidebarTab === 'friends' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`} title="好友">
          <IconBell active={sidebarTab === 'friends'} />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] leading-4 text-center">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* 统计行 + 添加好友 */}
      {sidebarTab === 'chats' && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-line">
          <span className="text-xs text-text-sub">交谈 {sortedPeerIds.length} / 未读 {totalUnread}</span>
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-6 h-6 flex items-center justify-center rounded bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
            title="添加好友"
          >
            +
          </button>
        </div>
      )}
```

原 chats tab 内"搜索栏 + ➕按钮"一行的 ➕ 按钮删除（保留 SearchBar），原三个文字 tab 按钮删除。tab 顺序：聊天/群聊/好友（沿用现状；好友 tab 挂申请角标）。

- [ ] **Step 2: ConversationItem 陌标 + 头像样式**

组件内追加订阅与计算：

```tsx
import { useFriendStore } from '@/stores/useFriendStore';
// 组件体内：
  const isStranger = conversation.type === 'c2c' && !useFriendStore((s) => s.friends.some((f) => f.userId === peerId));
```

（zustand 条件调用不合规——改为顶层订阅：`const friends = useFriendStore((s) => s.friends);` 再 `const isStranger = conversation.type === 'c2c' && !friends.some((f) => f.userId === peerId);`）

头像块替换为（方形圆角 + 陌标 + 未读角标移到头像右上）：

```tsx
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
          ) : (
            nickname.charAt(0).toUpperCase()
          )}
        </div>
        {isStranger && (
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-sm bg-warn text-white text-[9px] leading-4 text-center font-bold">陌</span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] leading-[18px] text-center group-hover:hidden">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
```

同时删除原"未读红点 或 悬停删除按钮"区块里的未读徽标 div（保留 hover 删除按钮），选中态 `bg-primary/10 border-l-2 border-primary` 保留。

- [ ] **Step 3: 验证 + Commit**

Run: `npm test && npm run build`
Expected: 全绿

```bash
git add src/components/MainPanel/index.tsx src/components/ConversationItem/index.tsx
git commit -m "feat: 主面板图标 tab/统计行与会话陌标精修"
```

---

### Task 7: 验收

**Files:**
- Modify: 验收发现的问题微调

- [ ] **Step 1: 自动化**

Run: `npm test && npm run build`
Expected: 全绿

- [ ] **Step 2: 手动验收清单（用户执行，双开浏览器）**

1. 聊天窗打开：标题栏左段=我的头像+昵称+⚙，右段=对方名+（陌生人橙色标签/群聊标签），🔊 ⛶ ✕ 三个按钮
2. ⚙ 弹出"我的个人信息"（头像/昵称/ID号/关闭）
3. 右栏三 tab：对方信息（头像/昵称/ID号/基本信息行/底部按钮）；对方相册="暂无相册"；语音介绍="暂无语音介绍"
4. 好友会话右栏底部=红色"删除好友"（点击出确认）；陌生人会话=蓝色"加为好友"（发送后变"已发送申请"）
5. 我方气泡=浅蓝底深字，尖角同色
6. 输入区：无边框浅灰底、占位"输入聊天信息，按 Enter 键快速发送 ..."；Ctrl+Enter 换行、Enter 发送
7. 发送+▼ 组合按钮；▼ 展开快捷回复浮层，点击直接发送并收起
8. 底行左侧"● 通信正常"（断线时变红"通信中断"），右侧 Ctrl+Enter 提示
9. 主面板：三个图标 tab（好友 tab 有申请时红点角标）；"交谈 X / 未读 Y"统计行 + ➕
10. 会话项：方形圆角头像、陌生人左上橙色"陌"标、未读角标在头像右上
11. 双段标题栏拖动/全屏/双击全屏仍正常

- [ ] **Step 3: 修复问题并 commit**

```bash
git add -A
git commit -m "fix: P1.5 验收问题修整"
```
