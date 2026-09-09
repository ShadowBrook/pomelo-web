# P1.7 样式与窗口模型一比一精修 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec §13 把 pomelo-web 的窗口模型简化为 v9 单一复合窗（恒对接/全屏/整体隐藏），并把主面板、聊天窗、登录页样式逐像素对齐参考截图。

**Architecture:** `useWindowStore` 收敛为 `{imVisible, fullscreen, chatPeerId}` 三状态；新增 `IMShell` 复合窗组件（左主面板列 300px + 右聊天窗列）替代 DraggableWindow 体系；全局新增 Toast；其余组件原地重写样式、不改数据流（useChatStore/useConversationStore/useFriendStore/useGroupStore/useIMClient 不动）。

**Tech Stack:** React 19 + TypeScript(strict) + Tailwind 4(`@theme`) + Zustand 5 + Vitest 4。

**Spec:** `docs/superpowers/specs/2026-09-04-web-im-redesign-design.md` §13（§13.1 窗口模型 / §13.2 token / §13.3 主面板 / §13.4 聊天窗 / §13.5 登录页 / §13.6 验收）。参考截图在仓库根 `.ref-shots/`（gitignored）：`rb_main1.jpg` 对接态、`rb_main2.jpg` 全屏态、`rb_main3.jpg` 关闭态、`funcs/27_qos.jpg` 最干净整机图、`funcs/4_friend_req.jpg` ➕菜单、`funcs/26_new.jpg` 标题徽章。

## Global Constraints

- 每个任务结束：`npm test` 全绿 + `npm run lint` 0 error + `npm run build` 通过，然后 git commit
- 不改后端、不改 `src/sdk/`、不改 useChatStore/useConversationStore/useFriendStore/useGroupStore 数据流（useWindowStore 与其消费方式除外）
- 后端未就绪的操作一律 `toast('功能开发中')`（降级），不许 console-only 或无响应
- 头像方形圆角 6px（`rounded-md`）用于列表/消息/详情；仅主面板用户卡头像为圆形（参考图如此）
- 颜色一律走 `@theme` token（Task 1 定义），组件里不写裸色值（覆盖层的红折角等伪元素在 index.css 中定义一次）
- 时间格式：列表项 今天→`HH:mm`、周内→`星期X`、今年→`X月X日`、往年→`YY/MM/DD`；消息上方 今天→`上午/下午HH:mm`、非今天→`M月D日 上午/下午HH:mm`（24 小时制+上午/下午前缀，与参考图一致）
- UI 文案使用与参考图一致的中文（发送/快捷回复/通信正常/管理群员…）

---

### Task 1: 主题 token 更新（index.css）

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces（后续所有任务引用）: tokens `titlebar-main #18479F`、`titlebar-chat #235AAD`、`bubble-self #CAE9FD`、`bubble-other #FFFFFF`、`chat-bg #F6F7FB`、`selected #DDF0FF`、`accent #28A0FF`、`send-btn #18479F`；`primary` 调为 `#235AAD`、`primary-dark #18479F`、`danger #FF4D50`、`topbar #1B232E`、`sidebar #FFFFFF`；工具类 `.corner-red`（会话选中左上红折角）。

- [ ] **Step 1: 重写 @theme 与伪元素**

`src/index.css` 全文替换为：

```css
@import "tailwindcss";

@theme {
  --color-primary: #235AAD;
  --color-primary-dark: #18479F;
  --color-danger: #FF4D50;
  --color-warn: #E6922E;
  --color-ok: #34AD64;
  --color-bg-page: #EDEFF3;
  --color-bg-deco-from: #DBE7FB;
  --color-bg-deco-to: #E8EEFB;
  --color-sidebar: #FFFFFF;
  --color-panel: #FFFFFF;
  --color-bubble-self: #CAE9FD;
  --color-bubble-other: #FFFFFF;
  --color-chat-bg: #F6F7FB;
  --color-selected: #DDF0FF;
  --color-accent: #28A0FF;
  --color-text-main: #1F2329;
  --color-text-sub: #8A919F;
  --color-line: #E4E7ED;
  --color-topbar: #1B232E;
  --color-titlebar-main: #18479F;
  --color-titlebar-chat: #235AAD;
  --color-send-btn: #18479F;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #EDEFF3;
}

/* 气泡小三角 */
.bubble-self::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 8px;
  border: 6px solid transparent;
  border-left-color: #CAE9FD;
  border-right: none;
}

.bubble-other::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 8px;
  border: 6px solid transparent;
  border-right-color: #FFFFFF;
  border-left: none;
}

/* 会话选中态左上红色折角（参考 rb_main1） */
.corner-red::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  border-top: 12px solid #FF4D50;
  border-right: 12px solid transparent;
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 通过（旧 token `titlebar-from/to` 的引用会在 Task 2/8 清理；若 build 因 `bg-gradient-to-b from-titlebar-from` 报 Tailwind 未知类不报错——Tailwind 4 未知类只是不生成样式，不阻塞编译。确认无 TS 错误即可）

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: P1.7 主题 token 对齐参考采样色（titlebar/bubble/selected/accent）"
```

---

### Task 2: 窗口模型 v9 化（useWindowStore 重写 + IMShell 复合窗 + 旧窗口体系删除）

**Files:**
- Modify: `src/stores/useWindowStore.ts`（重写）
- Create: `src/components/IMShell.tsx`
- Modify: `src/pages/Chat/index.tsx`、`src/components/TopNavBar/index.tsx`、`src/components/MainPanel/index.tsx`（仅窗口 API 调用点）
- Delete: `src/components/window/`（DraggableWindow.tsx、useWindowDrag.ts、clampPos.ts、WindowLayer.tsx）
- Test: `src/stores/useWindowStore.test.ts`

**Interfaces:**
- Produces: `useWindowStore` → `{ imVisible: boolean; fullscreen: boolean; chatPeerId: string | null; openIM(): void; hideIM(): void; toggleFullscreen(): void; openChat(peerId: string): void; closeChat(): void; clearAll(): void }`；导出常量 `MAIN_PANEL_WIDTH = 300`、`CHAT_PANEL_MIN_WIDTH = 640`
- Consumes: `useConversationStore.getSortedList()`（Chat 页自动打开最近会话）

- [ ] **Step 1: 写失败测试**

创建 `src/stores/useWindowStore.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from './useWindowStore';

describe('useWindowStore (v9 复合窗)', () => {
  beforeEach(() => useWindowStore.getState().clearAll());

  it('初始不可见', () => {
    expect(useWindowStore.getState().imVisible).toBe(false);
    expect(useWindowStore.getState().chatPeerId).toBeNull();
    expect(useWindowStore.getState().fullscreen).toBe(false);
  });

  it('openChat 打开界面并指向该会话；重复 openChat 幂等切换目标', () => {
    useWindowStore.getState().openChat('a');
    expect(useWindowStore.getState().imVisible).toBe(true);
    expect(useWindowStore.getState().chatPeerId).toBe('a');
    useWindowStore.getState().openChat('b');
    expect(useWindowStore.getState().chatPeerId).toBe('b');
  });

  it('hideIM 隐藏界面但保留 chatPeerId，openIM 恢复', () => {
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().hideIM();
    expect(useWindowStore.getState().imVisible).toBe(false);
    expect(useWindowStore.getState().chatPeerId).toBe('a');
    useWindowStore.getState().openIM();
    expect(useWindowStore.getState().imVisible).toBe(true);
  });

  it('toggleFullscreen 切换', () => {
    useWindowStore.getState().openIM();
    useWindowStore.getState().toggleFullscreen();
    expect(useWindowStore.getState().fullscreen).toBe(true);
    useWindowStore.getState().toggleFullscreen();
    expect(useWindowStore.getState().fullscreen).toBe(false);
  });

  it('closeChat 清空会话；clearAll 复位', () => {
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().toggleFullscreen();
    useWindowStore.getState().closeChat();
    expect(useWindowStore.getState().chatPeerId).toBeNull();
    expect(useWindowStore.getState().imVisible).toBe(true);
    useWindowStore.getState().clearAll();
    expect(useWindowStore.getState()).toMatchObject({ imVisible: false, fullscreen: false, chatPeerId: null });
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- useWindowStore`
Expected: FAIL（imVisible 不存在）

- [ ] **Step 3: 重写 store**

`src/stores/useWindowStore.ts` 全文替换：

```ts
import { create } from 'zustand';

/** 主面板列宽（v9 复合窗左列） */
export const MAIN_PANEL_WIDTH = 300;
/** 聊天窗列最小宽度 */
export const CHAT_PANEL_MIN_WIDTH = 640;

interface WindowState {
  /** 整个 IM 界面是否可见（聊天窗 ✕ = false，只留导航栏+背景） */
  imVisible: boolean;
  /** 复合窗全屏（参考 rb_main2） */
  fullscreen: boolean;
  /** 当前聊天窗指向的会话（null = 空态占位） */
  chatPeerId: string | null;

  openIM: () => void;
  hideIM: () => void;
  toggleFullscreen: () => void;
  openChat: (peerId: string) => void;
  closeChat: () => void;
  clearAll: () => void;
}

export const useWindowStore = create<WindowState>()((set) => ({
  imVisible: false,
  fullscreen: false,
  chatPeerId: null,

  openIM: () => set({ imVisible: true }),
  hideIM: () => set({ imVisible: false }),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  openChat: (peerId) => set({ chatPeerId: peerId, imVisible: true }),
  closeChat: () => set({ chatPeerId: null }),
  clearAll: () => set({ imVisible: false, fullscreen: false, chatPeerId: null }),
}));
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- useWindowStore`
Expected: PASS 5 项

- [ ] **Step 5: 新建 IMShell 复合窗**

创建 `src/components/IMShell.tsx`：

```tsx
import { useWindowStore, MAIN_PANEL_WIDTH } from '@/stores/useWindowStore';
import { UserCardTitle } from '@/components/UserCardTitle';
import { MainPanel } from '@/components/MainPanel';
import { ChatWindow } from '@/components/ChatWindow';

/**
 * v9 单一复合窗：主面板列 + 聊天窗列恒对接（参考 rb_main1）。
 * 全屏时铺满视口并盖过导航栏（参考 rb_main2）；imVisible=false 时不渲染（参考 rb_main3）。
 */
export function IMShell() {
  const imVisible = useWindowStore((s) => s.imVisible);
  const fullscreen = useWindowStore((s) => s.fullscreen);
  const chatPeerId = useWindowStore((s) => s.chatPeerId);
  if (!imVisible) return null;

  return (
    <div className={fullscreen ? 'fixed inset-0 z-20' : 'fixed inset-x-0 bottom-5 top-[68px] z-0 flex justify-center'}>
      <div
        className={`flex overflow-hidden bg-panel shadow-2xl ring-1 ring-black/10 ${
          fullscreen
            ? 'h-full w-full rounded-none'
            : 'w-[1080px] max-w-[calc(100vw-24px)] h-full rounded-lg'
        }`}
      >
        {/* 主面板列：深蓝用户卡头部 + 面板内容 */}
        <div className="flex flex-col flex-shrink-0 bg-sidebar" style={{ width: MAIN_PANEL_WIDTH }}>
          <UserCardTitle />
          <MainPanel />
        </div>

        {/* 接缝分隔线 */}
        <div className="w-px bg-line flex-shrink-0" />

        {/* 聊天窗列 */}
        <div className="flex-1 flex flex-col min-w-0 bg-panel">
          <ChatWindow peerId={chatPeerId} />
        </div>
      </div>
    </div>
  );
}
```

同时创建 `src/components/ChatWindow.tsx`（本任务先立骨架，头部/详情后续任务重写其内部引用的组件）：

```tsx
import { ChatWindowContent } from '@/components/ChatWindowContent';

/** 聊天窗列内容：peerId 为 null 时显示空态占位 */
export function ChatWindow({ peerId }: { peerId: string | null }) {
  if (!peerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-sub select-none">
        <svg viewBox="0 0 24 24" className="w-16 h-16 opacity-25" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span className="text-sm">暂无会话</span>
      </div>
    );
  }
  return <ChatWindowContent key={peerId} peerId={peerId} />;
}
```

- [ ] **Step 6: 改 Chat 页与 TopNavBar、MainPanel 调用点，删旧窗口体系**

`src/pages/Chat/index.tsx`：
- `import { WindowLayer } from '@/components/window/WindowLayer'` → `import { IMShell } from '@/components/IMShell'`
- 进入工作台 effect 改为：

```tsx
  // 进入工作台：IM 界面可见 + 最近一个会话（参考 v9 登录即展示）
  useEffect(() => {
    useWindowStore.getState().openIM();
    const sorted = useConversationStore.getState().getSortedList();
    if (sorted.length > 0) {
      useWindowStore.getState().openChat(sorted[0]);
    }
  }, []);
```

- JSX 尾部 `<WindowLayer />` → `<IMShell />`

`src/components/TopNavBar/index.tsx`：
- `hasMain` 改为 `const imVisible = useWindowStore((s) => s.imVisible);`
- 按钮 onClick：`imVisible ? useWindowStore.getState().hideIM() : useWindowStore.getState().openIM()`
- title：`imVisible ? '收起' : '打开'`

`src/components/MainPanel/index.tsx`：
- 删除 `import { useWindowStore, chatWindowId }` 中 `chatWindowId`，`handleDeleteConversation` 改为：

```tsx
  const handleDeleteConversation = useCallback((peerId: string) => {
    useConversationStore.getState().removeConversation(peerId);
    useChatStore.getState().clearMessages(peerId);
    const ws = useWindowStore.getState();
    if (ws.chatPeerId === peerId) {
      const next = useConversationStore.getState().getSortedList()[0];
      if (next) ws.openChat(next);
      else ws.closeChat();
    }
  }, []);
```

删除目录 `src/components/window/`（4 个文件）。

- [ ] **Step 7: 全量验证**

Run: `npm test && npm run lint && npm run build`
Expected: 全部通过（lint 若报未使用导入，随手清理）

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: P1.7 窗口模型 v9 化（useWindowStore 三状态 + IMShell 复合窗，删除可拖窗口体系）"
```

---

### Task 3: Toast 系统

**Files:**
- Create: `src/stores/useToastStore.ts`
- Create: `src/components/ToastHost.tsx`
- Modify: `src/pages/Chat/index.tsx`、`src/pages/Login/index.tsx`（挂载 `<ToastHost />`）
- Test: `src/stores/useToastStore.test.ts`

**Interfaces:**
- Produces: `toast(message: string)`（模块级函数，任意处直接调用）；`useToastStore` → `{ toasts: {id:number; message:string}[]; push(m:string): void; dismiss(id:number): void }`；`<ToastHost />` 渲染右下角堆叠黑方块（深灰 #3a3f45 圆角、白字、2.5s 自动消失，参考 `funcs/3_setups.jpg` 的「提示音已开」方块）

- [ ] **Step 1: 写失败测试**

`src/stores/useToastStore.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore, toast } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => useToastStore.getState().clearAll());

  it('toast() 入队并自动消失', () => {
    vi.useFakeTimers();
    toast('功能开发中');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(2600);
    expect(useToastStore.getState().toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('dismiss 可手动移除', () => {
    useToastStore.getState().push('hi');
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- useToastStore`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 store + Host**

`src/stores/useToastStore.ts`：

```ts
import { create } from 'zustand';

export interface ToastItem {
  id: number;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, durationMs?: number) => void;
  dismiss: (id: number) => void;
  clearAll: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, durationMs = 2500) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));

/** 模块级快捷入口：toast('功能开发中') */
export const toast = (message: string) => useToastStore.getState().push(message);
```

`src/components/ToastHost.tsx`：

```tsx
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
```

`Chat/index.tsx` 与 `Login/index.tsx` 各挂载 `<ToastHost />`（Login 为 `<div>` 根内末尾；Chat 放在 `<IMShell />` 之后）。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- useToastStore`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/useToastStore.ts src/stores/useToastStore.test.ts src/components/ToastHost.tsx src/pages/Chat/index.tsx src/pages/Login/index.tsx
git commit -m "feat: P1.7 全局 Toast（黑方块样式 + 模块级 toast()）"
```

---

### Task 4: 时间格式工具（列表 + 消息）

**Files:**
- Create: `src/utils/imTime.ts`
- Test: `src/utils/imTime.test.ts`
- 后续任务消费：Task 6（ConversationItem）、Task 9（MessageList）

**Interfaces:**
- Produces: `formatListTime(ts: number): string`（今天 `14:05` / 周内 `星期三` / 今年 `6月20日` / 往年 `21/12/07`）；`formatMsgTime(ts: number): string`（今天 `下午17:33` / 非今天 `6月21日 下午17:33`；上午/下午前缀 + 24 小时制，与参考图一致）

- [ ] **Step 1: 写失败测试**

`src/utils/imTime.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { formatListTime, formatMsgTime } from './imTime';

// 固定"现在"：2026-09-06 12:00 (周日)
const NOW = new Date(2026, 8, 6, 12, 0).getTime();

describe('formatListTime', () => {
  it('今天 → HH:mm', () => {
    expect(formatListTime(new Date(2026, 8, 6, 9, 5).getTime(), NOW)).toBe('09:05');
  });
  it('昨天 → 星期X', () => {
    expect(formatListTime(new Date(2026, 8, 5, 23, 0).getTime(), NOW)).toBe('星期六');
  });
  it('今年更早 → M月D日', () => {
    expect(formatListTime(new Date(2026, 5, 20, 10, 0).getTime(), NOW)).toBe('6月20日');
  });
  it('往年 → YY/MM/DD', () => {
    expect(formatListTime(new Date(2021, 11, 7, 10, 0).getTime(), NOW)).toBe('21/12/07');
  });
  it('ts=0 → 空串', () => {
    expect(formatListTime(0, NOW)).toBe('');
  });
});

describe('formatMsgTime', () => {
  it('今天下午 → 下午HH:mm', () => {
    expect(formatMsgTime(new Date(2026, 8, 6, 17, 33).getTime(), NOW)).toBe('下午17:33');
  });
  it('今天上午 → 上午HH:mm', () => {
    expect(formatMsgTime(new Date(2026, 8, 6, 9, 5).getTime(), NOW)).toBe('上午09:05');
  });
  it('非今天 → M月D日 上午/下午HH:mm', () => {
    expect(formatMsgTime(new Date(2026, 5, 21, 17, 33).getTime(), NOW)).toBe('6月21日 下午17:33');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- imTime`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

`src/utils/imTime.ts`：

```ts
const pad = (n: number) => String(n).padStart(2, '0');
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const WEEK = '日一二三四五六';

function parts(ts: number, now: number) {
  const d = new Date(ts);
  const n = new Date(now);
  const isToday = startOfDay(d) === startOfDay(n);
  const diffDays = Math.round((startOfDay(n) - startOfDay(d)) / 86400000);
  return { d, isToday, diffDays };
}

/** 会话列表右上角时间：今天 HH:mm / 周内 星期X / 今年 M月D日 / 往年 YY/MM/DD */
export function formatListTime(ts: number, now: number = Date.now()): string {
  if (!ts) return '';
  const { d, isToday, diffDays } = parts(ts, now);
  if (isToday) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (diffDays < 7) return `星期${WEEK[d.getDay()]}`;
  if (d.getFullYear() === new Date(now).getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${String(d.getFullYear()).slice(2)}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

/** 消息上方时间：[M月D日 ]上午/下午HH:mm（24 小时制 + 上午/下午前缀，参考截图样式） */
export function formatMsgTime(ts: number, now: number = Date.now()): string {
  const { d, isToday } = parts(ts, now);
  const hm = `${d.getHours() < 12 ? '上午' : '下午'}${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return isToday ? hm : `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}
```

注意：函数带 `now` 参数便于测试注入；调用方不传即用当前时间。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- imTime`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/imTime.ts src/utils/imTime.test.ts
git commit -m "feat: P1.7 时间格式工具（列表/消息两种格式，参考图对齐）"
```

---

### Task 5: 用户卡头部（深蓝 + ⚙下拉菜单）

**Files:**
- Modify: `src/components/UserCardTitle/index.tsx`（重写）
- Modify: `src/components/MainPanel/index.tsx`（删底部退出按钮与退出确认弹窗；删内部用户卡行）

**Interfaces:**
- Produces: `<UserCardTitle />`（高 64px，深蓝 `bg-titlebar-main`）：44px 圆形头像+左下绿色在线点、白色昵称、`✏`+签名行（无签名数据显示「编辑个性签名」白 60%）、右侧 ⚙ 下拉菜单（个人信息/修改密码/退出登陆(红)/关于我们/帮助中心）。个人信息=现有简版弹窗（样式沿用）；修改密码/关于我们/帮助中心=`toast('功能开发中')`；退出登陆=确认弹窗→`useConnStore.getState().requestLogout()`
- Consumes: `useAuthStore.user`、`useConnStore.requestLogout`、Task 3 的 `toast`

- [ ] **Step 1: 重写 UserCardTitle**

`src/components/UserCardTitle/index.tsx` 全文替换：

```tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConnStore } from '@/stores/useConnStore';
import { toast } from '@/stores/useToastStore';

type MenuKey = 'profile' | 'password' | 'logout' | 'about' | 'help';

/** 主面板头部用户卡（深蓝，参考 rb_main1 左上）：头像/昵称/签名/⚙菜单 */
export function UserCardTitle() {
  const user = useAuthStore((s) => s.user);
  const connState = useConnStore((s) => s.state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<'profile' | 'logout' | null>(null);

  const handleMenu = (key: MenuKey) => {
    setMenuOpen(false);
    if (key === 'profile' || key === 'logout') setDialog(key);
    else toast('功能开发中');
  };

  const menuItems: Array<{ key: MenuKey; label: string; danger?: boolean }> = [
    { key: 'profile', label: '个人信息' },
    { key: 'password', label: '修改密码' },
    { key: 'logout', label: '退出登陆', danger: true },
    { key: 'about', label: '关于我们' },
    { key: 'help', label: '帮助中心' },
  ];

  return (
    <div className="relative flex items-center gap-2.5 px-3 h-16 flex-shrink-0 bg-titlebar-main select-none">
      {/* 头像（圆形 + 左下在线点，参考图） */}
      <div className="relative flex-shrink-0">
        {user?.avatar ? (
          <img src={user.avatar} alt="me" className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white text-base">
            {user?.nickname?.charAt(0).toUpperCase() || '柚'}
          </div>
        )}
        {connState === 'connected' && (
          <span className="absolute left-0 bottom-0 w-2.5 h-2.5 rounded-full bg-ok border border-white/70" />
        )}
      </div>

      {/* 昵称 + 签名 */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[15px] font-medium text-white truncate leading-tight">{user?.nickname || '我'}</span>
        <span className="text-xs text-white/60 truncate leading-tight mt-0.5">
          <span className="mr-0.5">✏</span>编辑个性签名
        </span>
      </div>

      {/* ⚙ 菜单 */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        title="设置"
        className="w-7 h-7 rounded text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-[60px] z-50 w-32 bg-panel rounded-md shadow-xl border border-line py-1">
            {menuItems.map((it) => (
              <button
                key={it.key}
                onClick={() => handleMenu(it.key)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-page transition-colors ${it.danger ? 'text-danger' : 'text-text-main'}`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 个人信息弹窗（P3 重做，本版沿用简版） */}
      {dialog === 'profile' &&
        createPortal(
          <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setDialog(null)}>
            <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main flex items-center justify-between">
                我的个人信息
                <button onClick={() => setDialog(null)} className="text-text-sub hover:text-text-main text-base leading-none">✕</button>
              </div>
              <div className="p-4 flex flex-col items-center gap-2">
                {user?.avatar ? (
                  <img src={user.avatar} alt="me" className="w-16 h-16 rounded-md object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-primary text-white flex items-center justify-center text-xl">
                    {user?.nickname?.charAt(0).toUpperCase() || '我'}
                  </div>
                )}
                <span className="text-sm font-medium text-text-main">{user?.nickname}</span>
                <span className="text-xs text-text-sub">ID号：{user?.userId}</span>
              </div>
              <div className="border-t border-line p-3 text-right">
                <button onClick={() => setDialog(null)} className="px-4 py-1.5 text-sm rounded bg-panel border border-line text-text-sub hover:text-text-main">
                  关闭
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 退出确认弹窗 */}
      {dialog === 'logout' &&
        createPortal(
          <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setDialog(null)}>
            <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-5 text-center">
                <p className="text-sm text-text-main">确认退出登录吗？</p>
              </div>
              <div className="flex border-t border-line">
                <button onClick={() => setDialog(null)} className="flex-1 py-2.5 text-sm text-text-sub hover:bg-bg-page border-r border-line transition-colors">
                  取消
                </button>
                <button
                  onClick={() => useConnStore.getState().requestLogout()}
                  className="flex-1 py-2.5 text-sm text-danger hover:bg-bg-page font-medium transition-colors"
                >
                  退出
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
```

- [ ] **Step 2: MainPanel 移除重复用户卡与退出**

在 `src/components/MainPanel/index.tsx`：
- 删除「个人卡（参考产品：面板顶部）」整段 JSX（`<div className="flex items-center gap-2 px-3 py-3 border-b border-line">` 起，至其闭合）
- 删除 `showLogoutConfirm` state、底部「退出」按钮、退出确认弹窗整段；底部栏改为：

```tsx
      {/* 底部：连接状态（点击可重连） */}
      <button
        onClick={() => connState !== 'connected' && useConnStore.getState().requestReconnect()}
        disabled={connState === 'connected'}
        className={`flex items-center gap-1 px-3 py-2 border-t border-line bg-panel text-xs text-left flex-shrink-0 ${
          connState === 'connected' ? 'text-ok cursor-default' : 'text-danger'
        }`}
        title={connState === 'connected' ? undefined : '点击重连'}
      >
        ● {connState === 'connected' ? '通信正常' : connState === 'connecting' ? '连接中' : '通信中断，点击重连'}
      </button>
```

- 同时删除不再使用的 state 与 import（`showLogoutConfirm`、`SearchBar` 的 import 先保留——Task 6 处理）

- [ ] **Step 3: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add src/components/UserCardTitle src/components/MainPanel
git commit -m "feat: P1.7 深蓝用户卡头部（⚙下拉菜单：个人信息/修改密码/退出登陆/关于我们/帮助中心）"
```

---

### Task 6: 主面板三 tab + 统计行 + ➕菜单

**Files:**
- Modify: `src/components/MainPanel/index.tsx`
- Delete: `src/components/SearchBar/`（含 index.tsx；聊天 tab 无搜索框）

**Interfaces:**
- Produces: 三 tab `chats/friends/groups`（顺序即参考图：聊天/好友/群聊）；激活 tab = 蓝色填充图标 + `bg-selected`；好友 tab 红点角标=pendingRequests 数；每 tab 统计行：chats=`交谈 X / 未读 Y`(Y 红)+➕菜单（添加好友/创建群聊，参考 `funcs/4_friend_req`）、friends=`总好友 N`+右人形+图标、groups=`群聊数 N`+右加群图标；底部 footer 仅连接状态
- Consumes: Task 4 `formatListTime`、现有 `AddFriendDialog`/`CreateGroupDialog`/`FriendsPanel`/`GroupPanel`/`useUnreadCount`

- [ ] **Step 1: 重写 MainPanel**

`src/components/MainPanel/index.tsx` 全文替换：

```tsx
import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore } from '@/stores/useChatStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useWindowStore } from '@/stores/useWindowStore';
import { useConnStore } from '@/stores/useConnStore';
import { getProfile } from '@/utils/api';
import { ConversationItem } from '@/components/ConversationItem';
import { FriendsPanel } from '@/components/FriendsPanel';
import { GroupPanel } from '@/components/GroupPanel';
import { AddFriendDialog } from '@/components/AddFriendDialog';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';
import { useGroupStore } from '@/stores/useGroupStore';

type Tab = 'chats' | 'friends' | 'groups';

function IconChat({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.1.9 4 2.3 5.5-.2 1.2-.8 2.6-1.6 3.5-.2.2 0 .6.3.6 1.9-.2 3.6-1 4.7-1.8 1.3.5 2.8.8 4.3.8 5.5 0 10-3.9 10-8.6S17.5 3 12 3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconFriend({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5" />
      <path d="M16.5 4.5a3.5 3.5 0 0 1 0 7M18 15.2c1.9.6 3.2 2 3.7 4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconGroup({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
      <circle cx="8.5" cy="8.5" r="3" />
      <circle cx="16" cy="9.5" r="2.5" />
      <path d="M3 19c.7-2.7 3-4.5 5.5-4.5s4.8 1.8 5.5 4.5M14.5 14.8c2-.3 4 .9 4.8 3.2" />
    </svg>
  );
}

export function MainPanel() {
  const user = useAuthStore((s) => s.user);
  const connState = useConnStore((s) => s.state);
  const activePeerId = useConversationStore((s) => s.activePeerId);
  const openChat = useWindowStore((s) => s.openChat);
  const { totalUnread } = useUnreadCount();
  const pendingCount = useFriendStore((s) => s.pendingRequests.length);
  const friendCount = useFriendStore((s) => s.friends.length);
  const groupCount = useGroupStore((s) => Object.keys(s.groups).length);

  const sortedPeerIds = useConversationStore(
    useShallow((s) =>
      Object.keys(s.conversations).sort(
        (a, b) => (s.conversations[b].lastMessageTime || 0) - (s.conversations[a].lastMessageTime || 0),
      ),
    ),
  );

  const [tab, setTab] = useState<Tab>('chats');
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleSelectConversation = useCallback(
    (peerId: string) => {
      useConversationStore.getState().setActivePeer(peerId);
      openChat(peerId);
    },
    [openChat],
  );

  const handleDeleteConversation = useCallback((peerId: string) => {
    useConversationStore.getState().removeConversation(peerId);
    useChatStore.getState().clearMessages(peerId);
    const ws = useWindowStore.getState();
    if (ws.chatPeerId === peerId) {
      const next = useConversationStore.getState().getSortedList()[0];
      if (next) ws.openChat(next);
      else ws.closeChat();
    }
  }, []);

  const handleChatWithFriend = useCallback(
    (peerId: string, nickname: string, avatar: string) => {
      useConversationStore.getState().createConversation(peerId, nickname, avatar, 'c2c');
      useConversationStore.getState().setActivePeer(peerId);
      openChat(peerId);
      setTab('chats');
    },
    [openChat],
  );

  const handleSelectGroup = useCallback(
    (groupId: string, name: string) => {
      useConversationStore.getState().createConversation(groupId, name, '', 'group');
      useConversationStore.getState().setActivePeer(groupId);
      openChat(groupId);
      setTab('chats');
    },
    [openChat],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-sidebar">
      {/* 图标 tab 行：聊天 / 好友 / 群聊 */}
      <div className="flex border-b border-line flex-shrink-0">
        {([
          { key: 'chats', icon: IconChat, title: '消息', badge: 0 },
          { key: 'friends', icon: IconFriend, title: '好友', badge: pendingCount },
          { key: 'groups', icon: IconGroup, title: '群聊', badge: 0 },
        ] as const).map(({ key, icon: Icon, title, badge }) => (
          <button
            key={key}
            title={title}
            onClick={() => setTab(key)}
            className={`relative flex-1 h-10 flex items-center justify-center transition-colors border-r border-line last:border-r-0 ${
              tab === key ? 'bg-selected text-accent' : 'text-text-sub hover:text-text-main'
            }`}
          >
            <Icon active={tab === key} />
            {badge > 0 && (
              <span className="absolute top-1 left-1/2 translate-x-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-danger text-white text-[10px] leading-[15px] text-center">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 统计行（每 tab 各自，参考截图） */}
      {tab === 'chats' && (
        <div className="flex items-center justify-between pl-3 pr-2 py-1.5 border-b border-line flex-shrink-0">
          <span className="text-xs text-text-sub">
            交谈 {sortedPeerIds.length} / <span className="text-danger">未读 {totalUnread}</span>
          </span>
          <div className="relative">
            <button
              onClick={() => setPlusMenuOpen((v) => !v)}
              className="w-5 h-5 flex items-center justify-center rounded-sm bg-accent text-white text-sm leading-none hover:opacity-85"
              title="添加"
            >
              +
            </button>
            {plusMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-50 w-28 bg-panel rounded-md shadow-xl border border-line py-1">
                  <button onClick={() => { setPlusMenuOpen(false); setShowAddFriend(true); }} className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-bg-page">
                    添加好友
                  </button>
                  <button onClick={() => { setPlusMenuOpen(false); setShowCreateGroup(true); }} className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-bg-page">
                    创建群聊
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {tab === 'friends' && (
        <div className="flex items-center justify-between pl-3 pr-2 py-1.5 border-b border-line flex-shrink-0">
          <span className="text-xs text-text-sub">
            总好友 <span className="text-accent">{friendCount}</span>
          </span>
          <button onClick={() => setShowAddFriend(true)} className="w-5 h-5 flex items-center justify-center rounded-sm text-accent hover:bg-selected" title="添加好友">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5M18 8v6M15 11h6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      {tab === 'groups' && (
        <div className="flex items-center justify-between pl-3 pr-2 py-1.5 border-b border-line flex-shrink-0">
          <span className="text-xs text-text-sub">
            群聊数 <span className="text-accent">{groupCount}</span>
          </span>
          <button onClick={() => setShowCreateGroup(true)} className="w-5 h-5 flex items-center justify-center rounded-sm text-accent hover:bg-selected" title="创建群聊">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5M18 8v6M15 11h6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* 列表区 */}
      {tab === 'chats' && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* 确认提醒置顶特殊项（参考 rb_main1：绿铃铛 + 未读徽章，点击切好友 tab） */}
          {pendingCount > 0 && (
            <div
              onClick={() => setTab('friends')}
              className="group relative flex items-center px-3 py-2.5 cursor-pointer hover:bg-bg-page transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-md bg-ok flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] leading-[18px] text-center group-hover:hidden">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              </div>
              <div className="ml-2.5 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-main">确认提醒</span>
                </div>
                <p className="text-xs text-text-sub truncate mt-0.5">
                  {pendingRequests[0]
                    ? `${pendingRequests[0].nickname} 邀请您成为好友。`
                    : '您有新的好友申请。'}
                </p>
              </div>
            </div>
          )}
          {sortedPeerIds.length === 0 ? (
            <div className="text-center text-text-sub text-sm mt-10 px-4">暂无会话，点击 + 添加好友</div>
          ) : (
            sortedPeerIds.map((peerId) => (
              <ConversationItem
                key={peerId}
                peerId={peerId}
                isActive={activePeerId === peerId}
                onClick={() => handleSelectConversation(peerId)}
                onDelete={handleDeleteConversation}
              />
            ))
          )}
        </div>
      )}
      {tab === 'friends' && <FriendsPanel onChatWithFriend={handleChatWithFriend} />}
      {tab === 'groups' && <GroupPanel activeGroupId={activePeerId} onSelect={handleSelectGroup} />}

      {/* 底部：连接状态（点击可重连） */}
      <button
        onClick={() => connState !== 'connected' && useConnStore.getState().requestReconnect()}
        disabled={connState === 'connected'}
        className={`flex items-center gap-1 px-3 py-2 border-t border-line bg-panel text-xs text-left flex-shrink-0 ${
          connState === 'connected' ? 'text-ok cursor-default' : 'text-danger'
        }`}
        title={connState === 'connected' ? undefined : '点击重连'}
      >
        ● {connState === 'connected' ? '通信正常' : connState === 'connecting' ? '连接中' : '通信中断，点击重连'}
      </button>

      <AddFriendDialog open={showAddFriend} onClose={() => setShowAddFriend(false)} />
      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(groupId, name) => {
          useConversationStore.getState().createConversation(groupId, name, '', 'group');
          useConversationStore.getState().setActivePeer(groupId);
          openChat(groupId);
          setTab('chats');
          setShowCreateGroup(false);
        }}
      />
    </div>
  );
}
```

注意：
- `pendingRequests[0]` 需在组件顶部补一行订阅：`const pendingRequests = useFriendStore((s) => s.pendingRequests);`（`pendingCount` 已存在）
- 聊天 tab **无搜索框**；`SearchBar` 组件整个删除
- 群 tab 的创建群聊图标与 chats tab ➕ 菜单里的「创建群聊」共用 `showCreateGroup`/`CreateGroupDialog`

- [ ] **Step 2: 删除 SearchBar 组件**

```bash
rm -rf src/components/SearchBar
```

- [ ] **Step 3: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`
Expected: 通过；如 lint 报 hooks 顺序/未使用，按提示修正（`useGroupCount` 若被判定多余可直接内联 `useGroupStoreCount` 的实现）

```bash
git add -A
git commit -m "feat: P1.7 主面板三 tab/统计行/➕菜单（聊天-好友-群聊，参考 funcs/4_friend_req）"
```

---

### Task 7: ConversationItem 重写（参考会话项）

**Files:**
- Modify: `src/components/ConversationItem/index.tsx`
- Modify: `src/utils/api.ts` 或 `src/stores/useConversationStore.ts`：**不修改**（预览前缀在组件层做）

**Interfaces:**
- Consumes: Task 4 `formatListTime`、`useFriendStore.friends`（陌判定）、`mediaPreview` 产物（lastMessage 已是「[图片] xxx」形字符串）
- Produces: 会话项结构 = 40px `rounded-md` 头像（右上红未读角标 hover 隐藏、左上橙「陌」标）｜行1 =（群项）蓝字「群」徽章+名称+右侧 `formatListTime`｜行2 = 预览（`[草稿]` 红前缀 / `[图片][文件][语音][视频][名片]` 橙前缀着色）｜选中 = `bg-selected` + `.corner-red` 红折角｜hover 右上 ✕（删除确认浮层保留现有交互，样式改为白卡居中小浮层）

- [ ] **Step 1: 重写组件**

`src/components/ConversationItem/index.tsx` 全文替换：

```tsx
import React, { useState } from 'react';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { formatListTime } from '@/utils/imTime';

interface Props {
  peerId: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: (peerId: string) => void;
}

/** 预览文本前缀着色：[草稿] 红；[图片] 等媒体标签橙 */
function renderPreview(text: string) {
  if (!text) return <span className="text-text-sub">暂无消息</span>;
  const m = text.match(/^(\[[^\]]{1,6}\])\s*(.*)$/);
  if (!m) return <span className="text-text-sub">{text}</span>;
  const tag = m[1];
  const rest = m[2];
  const isDraft = tag === '[草稿]';
  return (
    <span className="text-text-sub">
      <span className={isDraft ? 'text-danger' : 'text-warn'}>{tag}</span>
      {rest ? ` ${rest}` : ''}
    </span>
  );
}

export const ConversationItem = React.memo(function ConversationItem({ peerId, isActive, onClick, onDelete }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const friends = useFriendStore((s) => s.friends);
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  if (!conversation) return null;

  const { nickname, avatar, lastMessage, lastMessageTime, unreadCount, draft, type } = conversation;
  const isGroup = type === 'group';
  const isStranger = !isGroup && !friends.some((f) => f.userId === peerId);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center px-3 py-2.5 cursor-pointer transition-colors ${
        isActive ? 'bg-selected corner-red' : 'hover:bg-bg-page'
      }`}
    >
      {/* 头像 */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center text-primary text-sm font-bold overflow-hidden">
          {avatar ? <img src={avatar} alt={nickname} className="w-full h-full object-cover" /> : nickname.charAt(0).toUpperCase()}
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

      {/* 两行内容 */}
      <div className="ml-2.5 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-text-main truncate flex items-center gap-1 min-w-0">
            {isGroup && <span className="text-[11px] text-accent flex-shrink-0 font-normal">群</span>}
            <span className="truncate">{nickname}</span>
          </span>
          <span className="text-[11px] text-text-sub flex-shrink-0 ml-2">{formatListTime(lastMessageTime)}</span>
        </div>
        <p className="text-xs truncate mt-0.5">{draft ? renderPreview(`[草稿] ${draft}`) : renderPreview(lastMessage)}</p>
      </div>

      {/* 悬停删除 */}
      <button
        onClick={(e) => { stop(e); setShowDeleteConfirm(true); }}
        className="absolute right-2 top-1.5 hidden group-hover:flex w-4 h-4 items-center justify-center text-text-sub hover:text-danger text-xs"
        title="删除会话"
      >
        ✕
      </button>

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 bg-panel flex flex-col items-center justify-center gap-2" onClick={stop}>
          <span className="text-xs text-text-main">删除该会话？</span>
          <div className="flex gap-2">
            <button onClick={(e) => { stop(e); setShowDeleteConfirm(false); }} className="px-3 py-1 text-xs rounded border border-line text-text-sub hover:text-text-main">取消</button>
            <button onClick={(e) => { stop(e); onDelete(peerId); }} className="px-3 py-1 text-xs rounded bg-danger text-white hover:opacity-90">删除</button>
          </div>
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add src/components/ConversationItem
git commit -m "feat: P1.7 会话项复刻（红折角选中/陌标/群徽章/时间/预览前缀着色/hover✕）"
```

---

### Task 8: FriendsPanel / GroupPanel 样式对齐 + GridAvatar

**Files:**
- Create: `src/components/GridAvatar/index.tsx`
- Modify: `src/components/FriendsPanel/index.tsx`、`src/components/GroupPanel/index.tsx`

**Interfaces:**
- Produces: `<GridAvatar name: string; members?: Array<{avatar:string; nickname:string}>; size?: number>` — 2×2 取前 4 个成员头像；无成员时主色字母块（群头像九宫格观感，参考 `funcs/8_create_group` 群列表）
- FriendsPanel: 待处理申请区+好友列表保留，头像改 `rounded-md`，项次行保留在线状态；头部「好友 (N)」分组标题删除（统计行已在 Task 6）
- GroupPanel: 删除「+ 创建群聊」按钮与内部创建弹窗（入口已移 MainPanel 统计行）；项改为 GridAvatar + 名称 + `创建于 YYYY-MM-DD HH:mm`（`group.createdAt`）+ 保留「邀请」内联入口（既有可用功能，样式弱化为文字链接）

- [ ] **Step 1: GridAvatar**

`src/components/GridAvatar/index.tsx`：

```tsx
interface Member {
  nickname: string;
  avatar: string;
}

interface Props {
  name: string;
  members?: Member[];
  className?: string;
}

/** 群头像：2×2 成员头像拼图；无成员数据时退化为字母块 */
export function GridAvatar({ name, members, className = 'w-10 h-10' }: Props) {
  const four = (members ?? []).slice(0, 4);
  if (four.length === 0) {
    return (
      <div className={`${className} rounded-md bg-primary/15 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden`}>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className={`${className} rounded-md overflow-hidden grid grid-cols-2 flex-shrink-0`}>
      {four.map((m, i) => (
        <div key={i} className="bg-primary/10 flex items-center justify-center text-[9px] text-primary overflow-hidden">
          {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.nickname.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: FriendsPanel 调整**

- 删除「好友 ({friends.length})」标题行；「好友申请」小节标题样式保留但改 `text-xs text-text-sub bg-bg-page`
- 所有头像 `rounded-full` → `rounded-md`（申请项与好友项），头像底色 `bg-gray-300` → `bg-primary/15 text-primary`

- [ ] **Step 3: GroupPanel 调整**

- 删除顶部创建按钮块与 `showCreate/newName/creating/handleCreate` 相关代码（弹窗一并删）
- `GroupItem`：头像改 `<GridAvatar name={group.name} members={useGroupStore.getState().groupMembers[group.groupId]} />`（在组件内用 hook 订阅 `useGroupStore((s) => s.groupMembers[group.groupId])`）；第二行 `{group.memberCount} 人` → `创建于 {formatListTime(group.createdAt)}`? 不对——创建时间用完整格式，新增本地 helper：

```tsx
const fmtDate = (ts: number) => {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
```

第二行：`创建于 {fmtDate(group.createdAt)}`；「邀请」按钮样式：`text-xs text-accent hover:underline px-1`（保留原展开逻辑）

- [ ] **Step 4: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add -A
git commit -m "feat: P1.7 好友/群列表面板对齐参考（GridAvatar、创建于时间、去内联建群入口）"
```

---

### Task 9: 聊天窗头部重构（标题段 + 页签长在蓝条上）

**Files:**
- Modify: `src/components/ChatWindowContent/index.tsx`（重构为 头部+两栏 主体）
- Modify: `src/components/ChatWindowHeader/index.tsx`（重写为纯标题段）
- Create: `src/components/DetailTabs/index.tsx`
- Modify: `src/components/ChatDetailPanel/index.tsx`（接收受控 tab props；内容重写在 Task 10）
- Delete: `src/components/ConnectionBanner/`

**Interfaces:**
- Produces: `DetailTabs` props `{ isGroup: boolean; isFriend: boolean; tab: 'info'|'album'|'voice'; onChange(t): void }` — 群聊渲染单页签「群组信息」（无切换）；1v1 三页签（好友→`好友信息/好友相册/语音介绍`；陌生人→`对方信息/对方相册/语音介绍`）。样式：白底激活页签（圆角上沿，参考 27_qos 右上），非激活白字，整条高 32px，宽度 260px 与详情栏对齐
- `ChatWindowHeader` props `{ peerId: string }` 纯标题段：名称 + 群聊 `👤 N人`（`useGroupStore` groupMembers 长度，缺省 `group.memberCount`）+ 陌生人棕底徽章；🔊/⛶/✕ 三图标属于**头部行右端**（IMShell 语义上属于聊天窗，本任务把它们放进 ChatWindowContent 头部行最右；🔊=toast 提示音已开/已关，⛶=`toggleFullscreen()`，✕=`hideIM()`）

- [ ] **Step 1: DetailTabs 组件**

`src/components/DetailTabs/index.tsx`：

```tsx
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
```

- [ ] **Step 2: ChatWindowHeader 重写（纯标题段）**

`src/components/ChatWindowHeader/index.tsx` 全文替换：

```tsx
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';

/** 聊天窗标题段：名称 + 人数/陌生人徽章（声音/全屏/关闭在头部行右端，见 ChatWindowContent） */
export function ChatWindowHeader({ peerId }: { peerId: string }) {
  const conversation = useConversationStore((s) => s.conversations[peerId]);
  const friend = useFriendStore((s) => s.friends.find((f) => f.userId === peerId));
  const group = useGroupStore((s) => s.groups[peerId]);
  const memberCount = useGroupStore((s) => s.groupMembers[peerId]?.length);

  const isGroup = conversation?.type === 'group';
  const isStranger = !isGroup && !friend;
  const count = memberCount ?? group?.memberCount;

  return (
    <div className="flex items-center gap-2 px-3 min-w-0 flex-1 h-full">
      <span className="text-sm font-medium text-white truncate">{conversation?.nickname ?? peerId}</span>
      {isGroup && (
        <span className="flex items-center gap-1 text-xs text-white/85 flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5" />
          </svg>
          {count != null ? `${count}人` : ''}
        </span>
      )}
      {isStranger && <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-warn text-white flex-shrink-0">陌生人</span>}
    </div>
  );
}
```

- [ ] **Step 3: ChatWindowContent 重构**

头部行 + 主体两栏；全文替换（保留既有 readStatus 弹窗与 handleReadClick）：

```tsx
import { useCallback, useState } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useConnStore } from '@/stores/useConnStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { toast } from '@/stores/useToastStore';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { ChatWindowHeader } from '@/components/ChatWindowHeader';
import { DetailTabs, DetailTab } from '@/components/DetailTabs';
import { ChatDetailPanel } from '@/components/ChatDetailPanel';

interface ReadStatus {
  readers: Array<{ userId: string; nickname: string; avatar: string }>;
  loading: boolean;
}

export function ChatWindowContent({ peerId }: { peerId: string }) {
  const s = useChatSession(peerId);
  const [tab, setTab] = useState<DetailTab>('info');
  const [soundOn, setSoundOn] = useState(true);
  const [readStatus, setReadStatus] = useState<ReadStatus | null>(null);
  const friend = useFriendStore((st) => st.friends.find((f) => f.userId === peerId));

  const handleReadClick = useCallback(
    async (_messageId: string, seq: number) => {
      setReadStatus({ readers: [], loading: true });
      try {
        const resp = await s.queryReadStatus(seq);
        setReadStatus({ readers: resp.readers || [], loading: false });
      } catch {
        setReadStatus(null);
      }
    },
    [s.queryReadStatus],
  );

  if (!s.conversation) {
    return <div className="flex-1 flex items-center justify-center text-sm text-text-sub">会话不存在</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 头部行：标题段(蓝) + 页签(右端 260px) + 窗控图标 */}
      <div className="h-16 flex items-stretch bg-titlebar-chat flex-shrink-0 select-none">
        <ChatWindowHeader peerId={peerId} />
        <div className="flex-1" />
        <DetailTabs isGroup={s.isGroup} isFriend={!!friend} tab={tab} onChange={setTab} />
        <div className="flex items-center gap-1 px-2 flex-shrink-0">
          <button
            onClick={() => { setSoundOn((v) => !v); toast(soundOn ? '提示音已关' : '提示音已开'); }}
            title={soundOn ? '关闭提示音' : '开启提示音'}
            className="w-7 h-7 rounded text-white/85 hover:bg-white/15 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {soundOn ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="M16 9l6 6M22 9l-6 6" />}
            </svg>
          </button>
          <button
            onClick={() => useWindowStore.getState().toggleFullscreen()}
            title={useWindowStore.getState().fullscreen ? '还原' : '全屏'}
            className="w-7 h-7 rounded text-white/85 hover:bg-white/15 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          <button
            onClick={() => useWindowStore.getState().hideIM()}
            title="关闭"
            className="w-7 h-7 rounded text-white/85 hover:bg-danger flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 主体：左聊天区 + 右详情栏 */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-chat-bg">
          <MessageList
            messages={s.messages}
            currentUserId={s.currentUserId}
            onRetry={s.retrySend}
            loadingHistory={s.loadingHistory}
            hasMore={s.hasMore}
            onLoadMore={s.loadMoreHistory}
            isGroup={s.isGroup}
            onReadClick={handleReadClick}
          />
          <MessageInput
            peerId={peerId}
            draft={s.draft}
            onSendText={s.sendText}
            onSendImage={s.sendImage}
            onSendFile={s.sendFile}
            onSendVoice={s.sendVoice}
            onSendVideo={s.sendVideo}
            onSendEmoji={s.sendEmoji}
            onDraftChange={s.onDraftChange}
            quickReplies={['正在处理紧急事情', '有事先离开一会儿']}
          />
        </div>
        <ChatDetailPanel peerId={peerId} isGroup={s.isGroup} tab={tab} onTabChange={setTab} />
      </div>

      {/* 群消息已读成员弹窗（保持现状） */}
      {readStatus && (/* …原弹窗 JSX 原样保留… */)}
    </div>
  );
}
```

注意：
- `disabled` prop 移除（连接状态不再禁用聊天窗输入——断线发送会走既有失败重试路径，参考产品亦如此）；`statusNode` prop 移除（Task 11 从 MessageInput 删掉）
- 「已读成员弹窗」原 JSX 原样搬运，不得丢失
- 全屏按钮的 title 读取 `useWindowStore.getState().fullscreen`（非响应式即可，纯 title 提示）

- [ ] **Step 4: ChatDetailPanel 先接受控 props（内容 Task 10 重写）**

`ChatDetailPanel` props 改为 `{ peerId: string; isGroup: boolean; tab: DetailTab; onTabChange: (t: DetailTab) => void }`：删除内部 `tab` state 与页签行 JSX，直接用 props 渲染对应内容（本任务先保持原内容渲染逻辑）。

- [ ] **Step 5: 删 ConnectionBanner，验证**

```bash
rm -rf src/components/ConnectionBanner
```

Run: `npm test && npm run lint && npm run build`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: P1.7 聊天窗头部重构（标题段+详情页签上蓝条+提示音/全屏/关闭，去聊天窗连接条）"
```

---

### Task 10: ChatDetailPanel 重写（参考详情栏）

**Files:**
- Modify: `src/components/ChatDetailPanel/index.tsx`

**Interfaces:**
- Consumes: Task 8 `GridAvatar`、Task 3 `toast`、`useGroupStore`（groups/groupMembers）
- Produces（参考 27_qos / main1 右栏）:
  - 1v1 info tab：56px `rounded-md` 头像+名称+（好友无备注概念,不显示性别徽章——后端无性别字段,显示会误导）；分节 `设置备注 ✏`（好友备注/手机号码/更多描述=「未设置」灰）、`基本信息`（ID号=peerId、邮箱/注册时间/最近登陆/最近 IP=「—」、好友显示`成为好友`=friendedAt 日期）、`其它说明`（无数据显示则整节隐藏）；底部：好友=左下红描边「删除好友」（保留现有确认删除/发送状态机，样式重排）；陌生人=右下蓝底「加为好友」（保留现有状态机）
  - album/voice tab：保留现有空态（`暂无相册`/`暂无语音介绍`）
  - group info：GridAvatar(48px)+群名（truncate）+`群ID: {peerId}` 灰字；`基本信息`节：当前群主（`group.ownerId`→成员昵称查找,是自己加红框「我」徽章,查不到显示 ownerId）、群内昵称（自己昵称）、群创建者（同群主查找）、建群时间（`YYYY-MM-DD HH:mm`）；`本群公告`节：`group.description` 或灰字「还没有设置公告，群主可点击进行设置！」；`群员信息`节：`管理群员 (N人)` 蓝描边按钮 + `邀请入群` 蓝底按钮（均 `toast('功能开发中')`）；底部：`↻ 转让本群`（accent 蓝）/ `⃠ 解散本群`（danger 红）→ toast
  - 样式：节标题 `text-sm font-medium text-text-main`（左对齐，前面无图标）；label 行 `label w-20 text-xs text-text-sub` + `value text-xs text-text-main`

- [ ] **Step 1: 重写组件**

按上述 Interfaces 完整实现（复用现有 `FooterAction` 的状态机逻辑，仅重排样式；群主昵称查找用 `useGroupStore((s) => s.groupMembers[peerId])` 里 `userId === group.ownerId` 的成员）。实现要点代码：

```tsx
// 节标题与信息行
function SectionTitle({ text }: { text: string }) {
  return <div className="text-sm font-medium text-text-main mb-2">{text}</div>;
}
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex text-xs leading-6">
      <span className="w-20 text-text-sub flex-shrink-0">{label}：</span>
      <span className="text-text-main break-all min-w-0">{value}</span>
    </div>
  );
}
```

群主/创建者取值：

```tsx
const members = useGroupStore((s) => s.groupMembers[peerId]);
const owner = members?.find((m) => m.userId === group?.ownerId);
const ownerName = owner?.nickname ?? group?.ownerId ?? '—';
const isSelfOwner = !!user && group?.ownerId === user.userId;
```

`我` 徽章：`<span className="ml-1 px-1 rounded-sm border border-danger text-danger text-[10px]">我</span>`

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add src/components/ChatDetailPanel
git commit -m "feat: P1.7 详情栏复刻（好友/群两形态分节布局+群公告/群员操作降级）"
```

---

### Task 11: MessageList 时间标签 + 消息区背景

**Files:**
- Modify: `src/components/MessageList/index.tsx`

**Interfaces:**
- Consumes: Task 4 `formatMsgTime`
- Produces: 时间标签改为**每条消息上方、靠头像侧**（对方→左缩进 `pl-[52px]`，自己→右对齐 `pr-[52px]`），灰色 `text-[11px] text-text-sub` 无底色；保留 5 分钟分组逻辑（组内首条显示）；消息区容器 `bg-chat-bg`

- [ ] **Step 1: 改造**

- 删除 `formatDividerTime` 与居中胶囊 JSX；`shouldShowTimeDivider` 保留
- 外层容器：`className="flex-1 overflow-y-auto py-3 bg-chat-bg"`
- map 内结构改为：

```tsx
        return (
          <div key={msg.id}>
            <div className={`mb-1 ${isSelf ? 'text-right pr-[52px]' : 'text-left pl-[52px]'}`}>
              {showTime && <span className="text-[11px] text-text-sub">{formatMsgTime(msg.timestamp)}</span>}
            </div>
            <MessageBubble message={msg} isSelf={isSelf} onRetry={onRetry} isGroup={isGroup} onReadClick={onReadClick} />
          </div>
        );
```

- 空态容器同步 `bg-chat-bg`

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add src/components/MessageList
git commit -m "feat: P1.7 消息时间标签改为气泡上方靠头像侧（去胶囊底），消息区淡灰底"
```

---

### Task 12: MessageBubble 样式改造（方角头像/白+浅蓝泡/QoS 外置）

**Files:**
- Modify: `src/components/MessageBubble/index.tsx`

**Interfaces:**
- Consumes: `useAuthStore`（自己头像）
- Produces: 对方=36px `rounded-md` 头像（senderNickname 首字母兜底）+白色泡（`bg-bubble-other border border-line shadow-sm`）；自己=authStore 头像（无则主色字母块）+`bg-bubble-self` 泡；QoS 图标移到气泡**外侧靠头像一侧**：`pending/sending`=灰色 spinner（`animate-spin` SVG 圆弧），`failed`=红 ❗（text 消息可点击 `onRetry`，title「发送失败，点击重试」；媒体消息 title「发送失败，请重新选择文件」），`sent/delivered/seen`=不显示；群已读 ◯ 保留外置同槽位；`StatusIcon` 内的 ✓/✓✓/◯ 蓝色逻辑删除

- [ ] **Step 1: 重写组件外层与状态槽**

外层与头像部分替换为：

```tsx
export const MessageBubble = React.memo(function MessageBubble({ message, isSelf, onRetry, isGroup, onReadClick }: Props) {
  const avatar = useAuthStore((s) => s.user?.avatar);
  const selfChar = useAuthStore((s) => s.user?.nickname?.charAt(0).toUpperCase() || '我');

  const qos = isSelf && !isGroup && (message.status === 'pending' || message.status === 'sending' || message.status === 'failed');

  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-2 px-4 items-start`}>
      {/* 外置状态/QoS 槽（自己消息在气泡左侧） */}
      {isSelf && (
        <div className="w-6 flex justify-center items-center self-center flex-shrink-0 mr-1">
          {qos && (message.status === 'pending' || message.status === 'sending') && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-sub animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a10 10 0 1 1-10 10" strokeLinecap="round" />
            </svg>
          )}
          {qos && message.status === 'failed' && (
            <span
              className="w-4 h-4 rounded-full bg-danger text-white text-[10px] leading-4 text-center font-bold cursor-pointer"
              title={message.msgType === MsgType.TEXT ? '发送失败，点击重试' : '发送失败，请重新选择文件'}
              onClick={() => message.msgType === MsgType.TEXT && onRetry?.(message.id)}
            >
              !
            </span>
          )}
          {isGroup && message.seq && (
            <span
              className="text-xs text-accent cursor-pointer hover:opacity-75"
              title="查看已读成员"
              onClick={(e) => { e.stopPropagation(); onReadClick?.(message.id, message.seq!); }}
            >
              ◯
            </span>
          )}
        </div>
      )}

      {!isSelf && (
        <div className="w-9 h-9 rounded-md bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary text-xs mr-2 overflow-hidden">
          {(message.senderAvatar || '') ? (
            <img src={message.senderAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            (message.senderNickname || message.senderUserName || message.senderId).charAt(0).toUpperCase()
          )}
        </div>
      )}

      {/* 气泡 */}
      <div className={`max-w-[60%] px-3 py-2 rounded-md text-sm break-words relative ${
        isSelf ? 'bg-bubble-self text-text-main bubble-self' : 'bg-bubble-other text-text-main border border-line shadow-sm bubble-other'
      }`}>
        <Body message={message} />
      </div>

      {isSelf && (
        <div className="w-9 h-9 rounded-md bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary text-xs ml-2 overflow-hidden">
          {avatar ? <img src={avatar} alt="me" className="w-full h-full object-cover" /> : selfChar}
        </div>
      )}
    </div>
  );
});
```

注意：
- `ChatMessage` 是否有 `senderAvatar` 字段需先确认（`useChatStore.ts` 的 ChatMessage 接口）；若无则删掉 `senderAvatar` 分支、只保留首字母兜底，**不得顺手改 store**
- 删除旧 `StatusIcon` 函数与气泡内状态块；`delivered/seen/sent` 无图标
- `Body`、`ImageMessage` 原样保留

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add src/components/MessageBubble
git commit -m "feat: P1.7 气泡复刻（方角头像/白泡描边/QoS spinner+红叹号外置可重试）"
```

---

### Task 13: MessageInput 改造（8+1 灰色线性工具栏 / 白底 / 右下发送）

**Files:**
- Modify: `src/components/MessageInput/index.tsx`

**Interfaces:**
- Consumes: Task 3 `toast`
- Produces: 白底容器（`bg-panel border-t border-line`）；工具栏 9 个 18px 灰色线性图标（顺序=参考图：表情/文件/图片/个人名片/群名片/位置/@/清屏，末尾追加麦克风保留现有录音能力——参考图无麦克风，此为保留既有功能的刻意偏差）：名片/位置/@/清屏 → `toast('功能开发中')`；表情=现有 EmojiPicker 入口；文件/图片=现有隐藏 input；录音=现有 `toggleRecord`（图标线性麦克风，录音中红色）。底行仅右侧：`按 Ctrl+Enter 换行，按 Enter 发送` + `发送▼` 组合按钮（`bg-send-btn`，▼ 深一档 `bg-primary-dark border-l border-white/25`）；删除 `statusNode` prop 与 `disabled` prop（断线发送走失败重试路径）——保留 `disabled` 会导致断线时完全不能输入，与参考产品不符

- [ ] **Step 1: 改造**

要点（在现有文件上改，录音逻辑/隐藏 input/handleKeyDown 全部保留）：
- 容器：`<div className="bg-panel border-t border-line px-3 pt-2 pb-2">`
- 工具栏替换为（图标统一 `w-[18px] h-[18px] text-text-sub hover:text-text-main`，按钮 `p-1`）：

```tsx
      {/* 工具栏：参考图 8 图标 + 麦克风（保留录音能力） */}
      <div className="flex items-center gap-1 mb-1.5">
        <ToolButton title="表情" onClick={() => setShowEmoji((v) => !v)}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" strokeLinecap="round" />
            <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" /><circle cx="15" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        </ToolButton>
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
        {showEmoji && (/* EmojiPicker 原样，Suspense 包裹保留 */)}
      </div>
```

`ToolButton` 内部小组件（文件内定义）：

```tsx
function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 text-text-sub hover:text-text-main transition-colors">
      {children}
    </button>
  );
}
```

- 删除 `disabled`/`statusNode` props：`handleSend` 条件去掉 `disabled`；工具栏/按钮 `disabled` 全部去掉；底行改为：

```tsx
      {/* 底行：右对齐提示 + 发送组合按钮 */}
      <div className="flex items-center justify-end gap-2 mt-1">
        <span className="text-[11px] text-text-sub">按 Ctrl+Enter 换行，按 Enter 发送</span>
        <div className="relative flex">
          <button onClick={handleSend} disabled={!text.trim()}
            className="px-5 py-1.5 bg-send-btn text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 rounded-l-sm transition-opacity">
            发送
          </button>
          <button onClick={() => setShowQuick((v) => !v)} title="快捷回复"
            className="px-2 py-1.5 bg-primary-dark text-white text-xs hover:opacity-90 border-l border-white/25 rounded-r-sm transition-opacity">
            ▼
          </button>
          {showQuick && (/* 快捷回复浮层 JSX 原样保留 */)}
        </div>
      </div>
```

- 录音提示条保留；`textarea` 保留（`bg-transparent` 在白底上即为白）
- `ChatWindowContent`（Task 9 已改）调用处不再传 `disabled`/`statusNode`——若 Task 9 漏删，此处同步删除并确认编译

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add src/components/MessageInput src/components/ChatWindowContent
git commit -m "feat: P1.7 输入区复刻（8+1 灰色线性工具栏/白底/右下发送▼，未就绪项降级 toast）"
```

---

### Task 14: 登录页复刻（三态 + 点纹背景 + 居中 logo）

**Files:**
- Modify: `src/pages/Login/index.tsx`

**Interfaces:**
- Produces: 三态视图 `login / register / forgot`：
  - 背景：`radial-gradient(#d9dce3 1px, transparent 1px)` 点纹平铺（size 16px）+ 底色 `#eef0f4`
  - 居中块：白圆角方块（56px，内放主蓝云朵 SVG）+「Pomelo Chat」斜体粗标（`italic font-extrabold text-2xl`，主蓝）+ 橙色小徽章「Web 版」（白字 `bg-warn` 圆角+两侧短横线装饰可选）
  - 登录态：✉ 输入框（用户名或ID）/🔒 密码框（带左图标灰 16px，输入框 `h-10 rounded-md border border-line bg-white focus:border-accent`）｜`记住密码` checkbox（默认勾选，UI 记忆 localStorage 即可——YAGNI：仅视觉，不实现自动登录）+右侧 `忘记密码?` 链接（accent 蓝）｜蓝色主按钮「登录」（`h-10 rounded-md bg-primary hover:bg-primary-dark text-white`）｜下方「注册」链接
  - 注册态：用户名/昵称/密码/确认密码（行内 label 形式 `昵称：`，参考图）；红色校验提示「* 密码长度最少6位!」（密码 <6 时显示）；性别 radio（男/女，仅 UI 不上送）；`☑我已阅读并接受 服务条款`(链接 toast('功能开发中'))；按钮「注册」；下方「已有帐号？直接登录」链接。**提交载荷仍用现有 `register(userName, nickname, password)`**
  - 忘记密码态：灰字标题 `FIND YOUR ACCOUNT`、邮箱输入、说明行、蓝按钮「发送邮件」→ `toast('功能开发中')`、「返回登录界面」链接
  - 底部固定：`确保使用 Chrome、FireFox、Safari、Edge 等新式浏览器，以便获得更好地体验。` + `© 2026 Pomelo Chat`
  - 错误提示沿用现有 error 红字；ToastHost 已挂载（Task 3）

- [ ] **Step 1: 重写页面**

结构（保留 `handleLogin/handleRegister` 逻辑与 `useAuthStore` 调用不动，仅外壳与表单样式重写；`view` state 取代 `activeTab`）：

```tsx
const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
```

布局骨架：

```tsx
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{ backgroundColor: '#eef0f4', backgroundImage: 'radial-gradient(#d9dce3 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
      <div className="w-full max-w-[360px]">
        {/* Logo 块 */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-primary" fill="currentColor">
              <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.1.9 4 2.3 5.5-.2 1.2-.8 2.6-1.6 3.5-.2.2 0 .6.3.6 1.9-.2 3.6-1 4.7-1.8 1.3.5 2.8.8 4.3.8 5.5 0 10-3.9 10-8.6S17.5 3 12 3z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="italic font-extrabold text-2xl text-primary">Pomelo Chat</span>
          </div>
          <span className="mt-1.5 px-2 py-0.5 rounded-sm bg-warn text-white text-xs">Web 版</span>
        </div>

        {/* 三态表单卡片区域（无边框卡片，直接铺在点纹上，参考图无卡片壳） */}
        {view === 'login' && (/* 登录表单 */)}
        {view === 'register' && (/* 注册表单 */)}
        {view === 'forgot' && (/* 忘记密码 */)}
      </div>
      <div className="absolute bottom-4 inset-x-0 text-center text-xs text-text-sub space-y-1">
        <p>确保使用 Chrome、FireFox、Safari、Edge 等新式浏览器，以便获得更好地体验。</p>
        <p>© 2026 Pomelo Chat</p>
      </div>
      <ToastHost />
    </div>
  );
```

带图标输入框组件（文件内定义）：

```tsx
function IconInput({ icon, placeholder, type = 'text', value, onChange }: {
  icon: React.ReactNode; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub">{icon}</span>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-9 pr-3 rounded-md border border-line bg-white text-sm text-text-main placeholder:text-text-sub focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}
```

（✉ 与 🔒 用两个简单 SVG；登录态下「记住密码」checkbox 默认 `checked` + 只读视觉；`忘记密码?` onClick → `setView('forgot')`；登录成功仍 `navigate('/chat')`。注册态用行内 label 布局：`<div className="flex items-center gap-2"><span className="w-14 text-sm text-text-main flex-shrink-0">昵称：</span><input .../></div>`；密码 <6 位时显示 `<p className="text-danger text-xs">* 密码长度最少6位!</p>` 并禁用提交。）

- [ ] **Step 2: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add src/pages/Login
git commit -m "feat: P1.7 登录页复刻（点纹背景/居中 logo/登录-注册-忘记密码三态，字段按现有接口降级）"
```

---

### Task 15: 全量验收（对照参考截图）

**Files:** 无新文件（只跑验证 + 修尾差）

- [ ] **Step 1: 全量自动化**

Run: `npm test && npm run lint && npm run build`
Expected: 全绿

- [ ] **Step 2: dev server 目检（对照 `.ref-shots/`）**

启动 `npm run dev`（后台），逐项核对并修掉发现的小尾差（尺寸/间距/颜色 ±）：
- 登录页三态 vs `funcs/1_login.jpg`
- 对接态整体：`rb_main1.jpg`——用户卡深蓝、tab 浅蓝激活、统计行、会话项红折角、聊天窗头部亮蓝+页签、详情栏、白底输入区
- 全屏态：点聊天窗 ⛶ → 铺满盖过导航栏（`rb_main2.jpg`），再点还原
- 关闭态：点聊天窗 ✕ → 只剩导航栏+背景（`rb_main3.jpg`），点右上气泡按钮恢复
- 空会话态：退出后用新账号登录 → 复合窗显示「暂无会话」占位不崩溃
- 断线态：停掉后端 → 主面板底部红字「通信中断，点击重连」可点
- 收发消息回归：文本/图片/文件/表情互发、历史加载、快捷回复、撤回前 QoS（断网发送→红❗→恢复重试）

- [ ] **Step 3: 尾差修正 + 最终提交**

```bash
git add -A
git commit -m "style: P1.7 验收尾差修正"
```

（若无尾差则跳过提交）
