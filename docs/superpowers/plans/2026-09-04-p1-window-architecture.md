# P1 窗口架构重构实施计划（复刻 RainbowChat-Web 风格）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有微信风全屏 SPA 重构为"背景工作台 + 主面板窗 + 多聊天浮动窗"架构，并整体换为经典蓝桌面主题；现有功能（单聊/群聊/好友/表情/图片/文件/语音/视频/历史/已读回执）全部平移可用。

**Architecture:** 新增 `useWindowStore`（窗口状态机）+ `<WindowLayer>`（portal 渲染层）+ `<DraggableWindow>`（拖动/全屏/关闭壳）。每个聊天窗通过 `useChatSession(peerId)` hook 持有该会话的发送/已读回执/群ACK/历史加载逻辑（从现 ChatPage 平移）。连接状态从 `useIMClient` 的组件本地 state 抽到共享的 `useConnStore`，`useIMClient` 仅在 ChatPage 调用一次（它有卸载断连副作用）。

**Tech Stack:** React 19 + TypeScript(strict) + Vite 8 + Tailwind CSS 4（`@theme` tokens）+ Zustand 5 + Vitest 4

**Spec:** `docs/superpowers/specs/2026-09-04-web-im-redesign-design.md`（本计划实现其 P1 期）

## Global Constraints

- `useIMClient()` 只允许在 `src/pages/Chat/index.tsx` 调用（其卸载 effect 会断开全局唯一 WebSocket；其余组件一律用 `getIMClient()` 或 `useConnStore`）
- Store 事件回调内一律用 `store.getState()`，不用 hook 订阅（现仓库约定，避免陈旧闭包）
- 颜色只允许用 `@theme` token 类（`bg-primary`/`text-text-sub` 等），组件内不得写品牌色 hex；唯一例外是标题栏渐变，用 token `from-titlebar-from to-titlebar-to`
- 不新增任何 npm 依赖
- 测试与源码同目录：`xxx.test.ts`（Vitest）
- 每个任务结束必须 `npm test` 全绿后再 commit
- 分支：`feat/web-im-redesign`

---

### Task 1: 蓝色主题 token 替换（全仓重命名）

**Files:**
- Modify: `src/index.css`
- Modify: 所有引用 `wechat-*` 类的组件（`grep -rl 'wechat-' src/`，含 MessageBubble、Chat 页、GroupPanel、FriendsPanel、ConversationItem、MessageInput、MessageList、AddFriendDialog、CreateGroupDialog、SearchBar、ConnectionBanner、EmojiPicker、Login 页等）

**Interfaces:**
- Produces: 全局 token（后续所有任务使用）：`primary` `primary-dark` `danger` `warn` `ok` `bg-page` `sidebar` `panel` `bubble-self` `bubble-other` `text-main` `text-sub` `line` `topbar` `titlebar-from` `titlebar-to`

- [ ] **Step 1: 重写 `src/index.css` 为新 token**

```css
@import "tailwindcss";

@theme {
  --color-primary: #2E6BE6;
  --color-primary-dark: #2456C4;
  --color-danger: #E64545;
  --color-warn: #E6922E;
  --color-ok: #3BB54A;
  --color-bg-page: #EDEFF3;
  --color-sidebar: #F7F8FA;
  --color-panel: #FFFFFF;
  --color-bubble-self: #2E6BE6;
  --color-bubble-other: #F2F3F5;
  --color-text-main: #1F2329;
  --color-text-sub: #8A919F;
  --color-line: #E4E7ED;
  --color-topbar: #2B2F36;
  --color-titlebar-from: #3572E8;
  --color-titlebar-to: #2A5BC8;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #EDEFF3;
}

/* 气泡小三角（颜色跟随新 token 值） */
.bubble-self::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 8px;
  border: 6px solid transparent;
  border-left-color: #2E6BE6;
  border-right: none;
}

.bubble-other::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 8px;
  border: 6px solid transparent;
  border-right-color: #F2F3F5;
  border-left: none;
}
```

- [ ] **Step 2: 全仓类名重命名（macOS sed，顺序：长名先于短名）**

```bash
grep -rl 'wechat-' src/ | xargs sed -i '' \
  -e 's/wechat-green-dark/primary-dark/g' \
  -e 's/wechat-green/primary/g' \
  -e 's/wechat-bg/bg-page/g' \
  -e 's/wechat-sidebar/sidebar/g' \
  -e 's/wechat-bubble-self/bubble-self/g' \
  -e 's/wechat-bubble-other/bubble-other/g' \
  -e 's/wechat-text-secondary/text-sub/g' \
  -e 's/wechat-text/text-main/g'
```

注意：`wechat-bubble-self` 会被 `-self` 规则覆盖前必须先于 `wechat-green`（此处无冲突，但 `wechat-text-secondary` 必须先于 `wechat-text`，已按上述顺序排列）。

- [ ] **Step 3: 验证无残留**

Run: `grep -rn 'wechat-' src/ ; echo "exit=$?"`
Expected: 无输出（exit=1）

- [ ] **Step 4: 全量验证**

Run: `npm test && npm run lint && npm run build`
Expected: 全部通过

- [ ] **Step 5: 手动 smoke**

Run: `npm run dev`，登录后目视：主题应为蓝色系（选中态/按钮蓝、气泡蓝/浅灰），无布局破损。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "style: 主题 token 替换为经典蓝桌面风格"
```

---

### Task 2: `useConnStore` 共享连接状态

**Files:**
- Create: `src/stores/useConnStore.ts`
- Test: `src/stores/useConnStore.test.ts`
- Modify: `src/hooks/useIMClient.ts`（connectionChange 回调内加一行）

**Interfaces:**
- Produces:
  - `useConnStore`：`{ state: ConnectionState; set(s): void; setReconnect(fn|null): void; setLogout(fn|null): void; requestReconnect(): void; requestLogout(): void }`
  - 约定：ChatPage 在 Task 7 注册 reconnect/logout 回调；MainPanel 底栏与 ChatWindowContent 通过 `useConnStore((s)=>s.state)` 订阅连接状态

背景：`useIMClient` 的 `connectionState` 是组件本地 useState，而新架构下主面板和 N 个聊天窗都需要它；且 `useIMClient` 有卸载断连副作用，只能被 ChatPage 调用一次，故必须抽到 Zustand。

- [ ] **Step 1: 写失败测试 `src/stores/useConnStore.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConnStore } from './useConnStore';

const reset = () => useConnStore.setState({ state: 'disconnected', reconnectFn: null, logoutFn: null });

describe('useConnStore', () => {
  beforeEach(reset);

  it('set 更新连接状态', () => {
    useConnStore.getState().set('connected');
    expect(useConnStore.getState().state).toBe('connected');
  });

  it('requestReconnect 调用已注册的回调', () => {
    const fn = vi.fn();
    useConnStore.getState().setReconnect(fn);
    useConnStore.getState().requestReconnect();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('未注册回调时 requestReconnect 不抛错', () => {
    expect(() => useConnStore.getState().requestReconnect()).not.toThrow();
  });

  it('setLogout 后 requestLogout 调用回调', () => {
    const fn = vi.fn();
    useConnStore.getState().setLogout(fn);
    useConnStore.getState().requestLogout();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/stores/useConnStore.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `src/stores/useConnStore.ts`**

```ts
import { create } from 'zustand';
import { ConnectionState } from '@/sdk/types';

interface ConnState {
  state: ConnectionState;
  reconnectFn: (() => void) | null;
  logoutFn: (() => void) | null;
  set: (s: ConnectionState) => void;
  setReconnect: (fn: (() => void) | null) => void;
  setLogout: (fn: (() => void) | null) => void;
  requestReconnect: () => void;
  requestLogout: () => void;
}

export const useConnStore = create<ConnState>()((set, get) => ({
  state: 'disconnected',
  reconnectFn: null,
  logoutFn: null,
  set: (state) => set({ state }),
  setReconnect: (reconnectFn) => set({ reconnectFn }),
  setLogout: (logoutFn) => set({ logoutFn }),
  requestReconnect: () => get().reconnectFn?.(),
  requestLogout: () => get().logoutFn?.(),
}));
```

- [ ] **Step 4: 运行测试通过**

Run: `npx vitest run src/stores/useConnStore.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 接入 `useIMClient`**

在 `src/hooks/useIMClient.ts` 的 `client.on('connectionChange', ...)` 回调开头加一行：

```ts
client.on('connectionChange', (state: ConnectionState) => {
  useConnStore.getState().set(state);   // ← 新增：共享给窗口组件
  setConnectionState(state);
  ...
```

并在文件顶部导入：`import { useConnStore } from '@/stores/useConnStore';`

- [ ] **Step 6: 全量验证 + Commit**

Run: `npm test && npm run lint`
Expected: 全绿

```bash
git add src/stores/useConnStore.ts src/stores/useConnStore.test.ts src/hooks/useIMClient.ts
git commit -m "feat: useConnStore 共享连接状态，供多窗口组件订阅"
```

---

### Task 3: `useWindowStore` 窗口状态机

**Files:**
- Create: `src/stores/useWindowStore.ts`
- Test: `src/stores/useWindowStore.test.ts`

**Interfaces:**
- Produces（Task 4/6/7 依赖，签名必须一致）:
  - `interface WinInfo { id: string; kind: 'main' | 'chat'; peerId: string | null; pos: { x: number; y: number }; zIndex: number; fullscreen: boolean }`
  - `MAIN_WINDOW_ID = 'main'`；`chatWindowId(peerId: string): string`（返回 `chat:${peerId}`）
  - actions: `openMain()` `openChat(peerId)` `close(id)` `focus(id)` `move(id, pos)` `toggleFullscreen(id)` `clearAll()`
  - 语义：`openMain`/`openChat` 重复调用不重复开窗（openChat 已存在时转为 focus）；zIndex 取自单调递增 `topZ`；`openChat` 的初始 pos 按 chat 窗数量级联偏移（`x: 200 + (n%6)*28, y: 120 + (n%6)*24`）

- [ ] **Step 1: 写失败测试 `src/stores/useWindowStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore, MAIN_WINDOW_ID, chatWindowId } from './useWindowStore';

const reset = () => useWindowStore.setState({ windows: [], topZ: 1 });

describe('useWindowStore', () => {
  beforeEach(reset);

  it('openMain 新增主面板窗', () => {
    useWindowStore.getState().openMain();
    const wins = useWindowStore.getState().windows;
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({ id: MAIN_WINDOW_ID, kind: 'main', peerId: null, fullscreen: false });
  });

  it('openMain 幂等', () => {
    useWindowStore.getState().openMain();
    useWindowStore.getState().openMain();
    expect(useWindowStore.getState().windows).toHaveLength(1);
  });

  it('openChat 新增聊天窗，peerId 正确', () => {
    useWindowStore.getState().openChat('a');
    const wins = useWindowStore.getState().windows;
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({ id: chatWindowId('a'), kind: 'chat', peerId: 'a' });
  });

  it('openChat 已存在时不开新窗', () => {
    useWindowStore.getState().openChat('a');
    const z = useWindowStore.getState().topZ;
    useWindowStore.getState().openChat('a');
    expect(useWindowStore.getState().windows).toHaveLength(1);
  });

  it('连续 openChat 级联偏移 pos', () => {
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().openChat('b');
    const [wa, wb] = useWindowStore.getState().windows;
    expect(wb.pos.x).toBeGreaterThan(wa.pos.x);
    expect(wb.pos.y).toBeGreaterThan(wa.pos.y);
  });

  it('focus 提升 zIndex 且单调递增', () => {
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().openChat('b');
    const zA1 = useWindowStore.getState().windows.find(w => w.peerId === 'a')!.zIndex;
    useWindowStore.getState().focus(chatWindowId('a'));
    const zA2 = useWindowStore.getState().windows.find(w => w.peerId === 'a')!.zIndex;
    expect(zA2).toBeGreaterThan(zA1);
    expect(useWindowStore.getState().topZ).toBe(zA2);
  });

  it('close 移除窗口', () => {
    useWindowStore.getState().openMain();
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().close(chatWindowId('a'));
    const wins = useWindowStore.getState().windows;
    expect(wins).toHaveLength(1);
    expect(wins[0].id).toBe(MAIN_WINDOW_ID);
  });

  it('move 更新位置', () => {
    useWindowStore.getState().openMain();
    useWindowStore.getState().move(MAIN_WINDOW_ID, { x: 10, y: 20 });
    expect(useWindowStore.getState().windows[0].pos).toEqual({ x: 10, y: 20 });
  });

  it('toggleFullscreen 切换全屏', () => {
    useWindowStore.getState().openMain();
    useWindowStore.getState().toggleFullscreen(MAIN_WINDOW_ID);
    expect(useWindowStore.getState().windows[0].fullscreen).toBe(true);
    useWindowStore.getState().toggleFullscreen(MAIN_WINDOW_ID);
    expect(useWindowStore.getState().windows[0].fullscreen).toBe(false);
  });

  it('clearAll 清空窗口与 topZ（登出用）', () => {
    useWindowStore.getState().openMain();
    useWindowStore.getState().openChat('a');
    useWindowStore.getState().clearAll();
    expect(useWindowStore.getState().windows).toHaveLength(0);
    expect(useWindowStore.getState().topZ).toBe(1);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/stores/useWindowStore.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `src/stores/useWindowStore.ts`**

```ts
import { create } from 'zustand';

export type WindowKind = 'main' | 'chat';

export interface WinInfo {
  id: string;
  kind: WindowKind;
  peerId: string | null;
  pos: { x: number; y: number };
  zIndex: number;
  fullscreen: boolean;
}

export const MAIN_WINDOW_ID = 'main';
export const chatWindowId = (peerId: string) => `chat:${peerId}`;

interface WindowState {
  windows: WinInfo[];
  topZ: number;
  openMain: () => void;
  openChat: (peerId: string) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, pos: { x: number; y: number }) => void;
  toggleFullscreen: (id: string) => void;
  clearAll: () => void;
}

export const useWindowStore = create<WindowState>()((set, get) => ({
  windows: [],
  topZ: 1,

  openMain: () =>
    set((s) => {
      if (s.windows.some((w) => w.id === MAIN_WINDOW_ID)) return s;
      return {
        windows: [
          ...s.windows,
          { id: MAIN_WINDOW_ID, kind: 'main' as const, peerId: null, pos: { x: 140, y: 100 }, zIndex: s.topZ + 1, fullscreen: false },
        ],
        topZ: s.topZ + 1,
      };
    }),

  openChat: (peerId) => {
    const id = chatWindowId(peerId);
    if (get().windows.some((w) => w.id === id)) {
      get().focus(id);
      return;
    }
    set((s) => {
      const n = s.windows.filter((w) => w.kind === 'chat').length;
      return {
        windows: [
          ...s.windows,
          {
            id,
            kind: 'chat' as const,
            peerId,
            pos: { x: 200 + (n % 6) * 28, y: 120 + (n % 6) * 24 },
            zIndex: s.topZ + 1,
            fullscreen: false,
          },
        ],
        topZ: s.topZ + 1,
      };
    });
  },

  close: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focus: (id) =>
    set((s) => {
      const win = s.windows.find((w) => w.id === id);
      if (!win || win.zIndex === s.topZ) return s;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: s.topZ + 1 } : w)),
        topZ: s.topZ + 1,
      };
    }),

  move: (id, pos) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, pos } : w)) })),

  toggleFullscreen: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, fullscreen: !w.fullscreen } : w)),
    })),

  clearAll: () => set({ windows: [], topZ: 1 }),
}));
```

- [ ] **Step 4: 运行测试通过**

Run: `npx vitest run src/stores/useWindowStore.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: 全量验证 + Commit**

Run: `npm test && npm run lint`
Expected: 全绿

```bash
git add src/stores/useWindowStore.ts src/stores/useWindowStore.test.ts
git commit -m "feat: useWindowStore 多窗口状态机（开窗/置顶/拖动/全屏/关闭）"
```

---

### Task 4: `clampPos` + `useWindowDrag` + `DraggableWindow` 窗口壳

**Files:**
- Create: `src/components/window/clampPos.ts`
- Test: `src/components/window/clampPos.test.ts`
- Create: `src/components/window/useWindowDrag.ts`
- Create: `src/components/window/DraggableWindow.tsx`

**Interfaces:**
- Consumes: `WinInfo` / `useWindowStore`（Task 3）
- Produces:
  - `clampPos(pos: {x:number;y:number}, winW: number, winH: number, vw: number, vh: number): {x:number;y:number}` — 拖动边界钳制：x ∈ `[-(winW-80), vw-80]`（保留 80px 可抓取），y ∈ `[0, vh-40]`
  - `useWindowDrag(win, width, height, move)` → `{ onPointerDown }`（标题栏用；target 为 button/input/textarea 时不启动拖动）
  - `<DraggableWindow win width height title children>`：portal 到 body；全屏时 `fixed inset-0`；标题栏右侧自带 全屏切换 + 关闭 按钮；双击标题栏切换全屏；任意 pointerdown 触发 `focus`

- [ ] **Step 1: 写失败测试 `src/components/window/clampPos.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { clampPos } from './clampPos';

describe('clampPos', () => {
  const vw = 1920, vh = 1080, w = 780, h = 540;

  it('范围内位置不变', () => {
    expect(clampPos({ x: 100, y: 100 }, w, h, vw, vh)).toEqual({ x: 100, y: 100 });
  });

  it('y 不允许为负', () => {
    expect(clampPos({ x: 100, y: -50 }, w, h, vw, vh).y).toBe(0);
  });

  it('y 底部至少保留 40px', () => {
    expect(clampPos({ x: 100, y: vh }, w, h, vw, vh).y).toBe(vh - 40);
  });

  it('x 右侧至少保留 80px 可抓取', () => {
    expect(clampPos({ x: vw }, w, h, vw, vh).x).toBe(vw - 80);
  });

  it('x 左侧保留 80px（窗口大部分拖出左边界时仍可拉回）', () => {
    expect(clampPos({ x: -(w * 2) }, w, h, vw, vh).x).toBe(-(w - 80));
  });

  it('窗口宽于视口时仍留 80px 可见', () => {
    const r = clampPos({ x: 0 }, 3000, 540, 1920, 1080);
    expect(r.x).toBe(-(3000 - 80));
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/components/window/clampPos.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `src/components/window/clampPos.ts`**

```ts
export interface Pos { x: number; y: number }

export function clampPos(pos: Pos, winW: number, winH: number, vw: number, vh: number): Pos {
  const minX = -(winW - 80);
  const maxX = vw - 80;
  const maxY = Math.max(0, vh - 40);
  return {
    x: Math.min(maxX, Math.max(minX, pos.x)),
    y: Math.min(maxY, Math.max(0, pos.y)),
  };
}
```

- [ ] **Step 4: 运行测试通过**

Run: `npx vitest run src/components/window/clampPos.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: 实现 `src/components/window/useWindowDrag.ts`**

```ts
import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { WinInfo } from '@/stores/useWindowStore';
import { clampPos } from './clampPos';

export function useWindowDrag(
  win: WinInfo,
  width: number,
  height: number,
  move: (id: string, pos: { x: number; y: number }) => void,
) {
  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if ((e.target as HTMLElement).closest('button, input, textarea')) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const baseX = win.pos.x;
      const baseY = win.pos.y;

      const onMove = (ev: PointerEvent) => {
        move(
          win.id,
          clampPos(
            { x: baseX + ev.clientX - startX, y: baseY + ev.clientY - startY },
            width, height, window.innerWidth, window.innerHeight,
          ),
        );
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [win.id, win.pos.x, win.pos.y, width, height, move],
  );

  return { onPointerDown };
}
```

- [ ] **Step 6: 实现 `src/components/window/DraggableWindow.tsx`**

```tsx
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { WinInfo } from '@/stores/useWindowStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useWindowDrag } from './useWindowDrag';

interface Props {
  win: WinInfo;
  width: number;
  height: number;
  title: ReactNode;
  children: ReactNode;
}

export function DraggableWindow({ win, width, height, title, children }: Props) {
  const focus = useWindowStore((s) => s.focus);
  const move = useWindowStore((s) => s.move);
  const close = useWindowStore((s) => s.close);
  const toggleFullscreen = useWindowStore((s) => s.toggleFullscreen);
  const { onPointerDown } = useWindowDrag(win, width, height, move);

  const style: CSSProperties = win.fullscreen
    ? { left: 0, top: 0, right: 0, bottom: 0, zIndex: win.zIndex }
    : { left: win.pos.x, top: win.pos.y, width, height, zIndex: win.zIndex };

  return createPortal(
    <div
      className={`fixed flex flex-col bg-panel border border-line shadow-2xl overflow-hidden ${win.fullscreen ? 'inset-0' : 'rounded-lg'}`}
      style={style}
      onPointerDown={() => focus(win.id)}
    >
      {/* 标题栏（深蓝渐变） */}
      <div
        className="h-10 flex items-center justify-between px-3 flex-shrink-0 select-none bg-gradient-to-b from-titlebar-from to-titlebar-to"
        onPointerDown={onPointerDown}
        onDoubleClick={() => toggleFullscreen(win.id)}
      >
        <div className="text-sm font-medium text-white truncate">{title}</div>
        <div className="flex items-center gap-1">
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
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 7: 全量验证 + 手动 smoke + Commit**

Run: `npm test && npm run lint && npm run build`
Expected: 全绿（组件暂未被引用，TS 不报未使用导出错误）

临时 smoke（可选）：本任务不接线，无法目视，跳过；Task 7 接线后统一验收。

```bash
git add src/components/window/
git commit -m "feat: DraggableWindow 窗口壳（拖动/置顶/全屏/关闭）"
```

---

### Task 5: `useChatSession` —— 每会话逻辑 hook（从 ChatPage 平移）

**Files:**
- Create: `src/hooks/useChatSession.ts`

**Interfaces:**
- Consumes: `getIMClient()`（不调用 `useIMClient()`！）、`useChatStore`/`useConversationStore`/`useGroupStore`/`useAuthStore`
- Produces（Task 6 依赖）:
  - `useChatSession(peerId: string)` → `{ conversation, messages, currentUserId, loadingHistory, hasMore, loadMoreHistory, sendText, sendImage, sendFile, sendVoice, sendVideo, sendEmoji, retrySend, draft, onDraftChange, queryReadStatus, isGroup }`
  - 语义：hook 挂载即 `openConversation`（拉缓存/增量）+ `clearUnread`；C2C 自动发已读回执（去重）；群聊自动发游标式 ACK；发送按会话类型路由到 `sendGroupMessage`/`sendMessage`

注意与原 ChatPage 的差异：原逻辑只服务 `activePeerId`，新 hook 服务"打开的窗口"，每个窗口实例独立持有一份去重 ref（原 `lastPeerRef` 切换清理逻辑不再需要，hook 随窗口挂载/卸载自然重建）。

- [ ] **Step 1: 实现 `src/hooks/useChatSession.ts`**

```ts
import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore, ChatMessage } from '@/stores/useChatStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { getIMClient } from '@/hooks/useIMClient';
import { MsgType } from '@/sdk/types';

// 稳定空数组引用，避免 selector 每次返回新数组导致重渲染
const EMPTY_MESSAGES: ChatMessage[] = [];

export interface ReadStatusResult {
  readers: Array<{ userId: string; nickname: string; avatar: string }>;
}

export function useChatSession(peerId: string) {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.userId || '';

  // 窄 selector：只订阅本窗口会话的数据
  const conversation = useConversationStore((s) => s.conversations[peerId] ?? null);
  const messages = useChatStore((s) => s.messages[peerId] ?? EMPTY_MESSAGES);
  const loadingHistory = useChatStore((s) => s.loadingHistory);
  const hasMore = useChatStore((s) => s.hasMoreHistory[peerId] !== false);

  const isGroup = conversation?.type === 'group';

  // 窗口打开 = 会话打开：加载缓存/增量 + 清未读
  useEffect(() => {
    const type = useConversationStore.getState().conversations[peerId]?.type ?? 'c2c';
    useChatStore.getState().openConversation(peerId, type);
    useConversationStore.getState().clearUnread(peerId);
  }, [peerId]);

  // C2C 已读回执：对收件消息去重后批量 markSeen
  const markedSeenRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (isGroup) return;
    const incomingIds = messages
      .filter((m) => m.senderId !== currentUserId && m.senderId !== '__self__' && !markedSeenRef.current.has(m.id))
      .map((m) => m.id);
    if (incomingIds.length > 0) {
      incomingIds.forEach((id) => markedSeenRef.current.add(id));
      getIMClient()?.markSeen(incomingIds);
    }
  }, [messages, isGroup, currentUserId]);

  // 群聊已读回执：用他人消息最大 seq 发游标式 ACK
  useEffect(() => {
    if (!isGroup) return;
    const maxSeq = messages
      .filter((m) => m.senderId !== currentUserId && m.senderId !== '__self__')
      .reduce((max, m) => Math.max(max, m.seq || 0), 0);
    if (maxSeq > 0) {
      getIMClient()?.sendGroupAck(peerId, maxSeq);
      useGroupStore.getState().updateLastReadSeq(peerId, maxSeq);
    }
  }, [messages, isGroup, currentUserId, peerId]);

  // 发送路由：按会话类型走 C2C 或群聊
  const sendFn = useCallback(
    (params: { recipientId: string; msgType: MsgType; content: string }) => {
      const client = getIMClient();
      if (!client) throw new Error('IMClient not connected');
      const group = useConversationStore.getState().conversations[peerId]?.type === 'group';
      return group
        ? client.sendGroupMessage(params.recipientId, params.msgType, params.content)
        : client.sendMessage(params);
    },
    [peerId],
  );

  const sendText = useCallback(
    (text: string) => {
      useChatStore.getState().sendText(peerId, text, sendFn);
      useConversationStore.getState().updateDraft(peerId, '');
    },
    [peerId, sendFn],
  );

  const sendMedia = useCallback(
    (opts: { msgType: MsgType; file: File; duration?: number }) => {
      useChatStore.getState().sendMedia(peerId, opts, sendFn);
    },
    [peerId, sendFn],
  );

  const retrySend = useCallback((messageId: string) => {
    useChatStore.getState().retryMessage(messageId, (params) => {
      const client = getIMClient();
      if (!client) throw new Error('IMClient not connected');
      return client.sendMessage(params);
    });
  }, []);

  const loadMoreHistory = useCallback(() => {
    const type = useConversationStore.getState().conversations[peerId]?.type ?? 'c2c';
    useChatStore.getState().loadMoreHistory(peerId, type);
  }, [peerId]);

  const onDraftChange = useCallback(
    (text: string) => {
      useConversationStore.getState().updateDraft(peerId, text);
    },
    [peerId],
  );

  const queryReadStatus = useCallback(
    async (seq: number): Promise<ReadStatusResult> => {
      const client = getIMClient();
      if (!client) return { readers: [] };
      return client.getGroupMsgReadStatus(peerId, seq);
    },
    [peerId],
  );

  return {
    conversation,
    messages,
    currentUserId,
    loadingHistory,
    hasMore,
    loadMoreHistory,
    sendText,
    sendImage: (f: File) => sendMedia({ msgType: MsgType.IMAGE, file: f }),
    sendFile: (f: File) => sendMedia({ msgType: MsgType.FILE, file: f }),
    sendVoice: (f: File, duration?: number) => sendMedia({ msgType: MsgType.VOICE, file: f, duration }),
    sendVideo: (f: File) => sendMedia({ msgType: MsgType.VIDEO, file: f }),
    sendEmoji: (f: File) => sendMedia({ msgType: MsgType.EMOJI, file: f }),
    retrySend,
    draft: conversation?.draft ?? '',
    onDraftChange,
    queryReadStatus,
    isGroup,
  };
}
```

- [ ] **Step 2: 验证**

Run: `npm test && npm run lint && npm run build`
Expected: 全绿（hook 暂未被引用）

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useChatSession.ts
git commit -m "feat: useChatSession 每会话逻辑 hook（从 ChatPage 平移，支持多窗）"
```

---

### Task 6: `MainPanel` 与 `ChatWindowContent` 组件

**Files:**
- Create: `src/components/MainPanel/index.tsx`
- Create: `src/components/ChatWindowContent/index.tsx`

**Interfaces:**
- Consumes: `useWindowStore`（`openChat`/`close(chatWindowId(peerId))`）、`useChatSession`（Task 5）、`useConnStore`（Task 2）、现有 `ConversationItem`/`SearchBar`/`FriendsPanel`/`GroupPanel`/`AddFriendDialog`/`CreateGroupDialog`/`MessageList`/`MessageInput`/`ConnectionBanner`
- Produces:
  - `<MainPanel />`：主面板窗内容（个人卡 + 三 tab + 会话列表 + 底部连接状态/退出）。点击会话/好友/群 → `setActivePeer` + `openChat`；删除会话时同步关闭对应聊天窗
  - `<ChatWindowContent peerId />`：聊天窗内容（ConnectionBanner + MessageList + MessageInput + 群已读弹窗）

行为变更说明（记录到 PR 描述）：
1. 侧栏搜索只保留"搜好友并开聊"路径；原"搜索当前会话聊天记录"面板移除，消息搜索将在 P2 移入聊天窗内（功能不丢失，位置变更）
2. 原 ChatPage 聊天头部的"+"（CreateGroupDialog，带 preSelectedFriend）移到主面板"好友"tab 的"发起群聊"按钮，功能保留

- [ ] **Step 1: 实现 `src/components/MainPanel/index.tsx`**

```tsx
import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useChatStore } from '@/stores/useChatStore';
import { useWindowStore, chatWindowId } from '@/stores/useWindowStore';
import { useConnStore } from '@/stores/useConnStore';
import { getProfile } from '@/utils/api';
import { ConversationItem } from '@/components/ConversationItem';
import { SearchBar } from '@/components/SearchBar';
import { FriendsPanel } from '@/components/FriendsPanel';
import { GroupPanel } from '@/components/GroupPanel';
import { AddFriendDialog } from '@/components/AddFriendDialog';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';

export function MainPanel() {
  const user = useAuthStore((s) => s.user);
  const connState = useConnStore((s) => s.state);
  const activePeerId = useConversationStore((s) => s.activePeerId);
  const openChat = useWindowStore((s) => s.openChat);

  const sortedPeerIds = useConversationStore(
    useShallow((s) =>
      Object.keys(s.conversations).sort(
        (a, b) => (s.conversations[b].lastMessageTime || 0) - (s.conversations[a].lastMessageTime || 0),
      ),
    ),
  );

  const [sidebarTab, setSidebarTab] = useState<'chats' | 'groups' | 'friends'>('chats');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    useWindowStore.getState().close(chatWindowId(peerId));
  }, []);

  const handleChatWithFriend = useCallback(
    (peerId: string, nickname: string, avatar: string) => {
      useConversationStore.getState().createConversation(peerId, nickname, avatar, 'c2c');
      useConversationStore.getState().setActivePeer(peerId);
      openChat(peerId);
      setSidebarTab('chats');
    },
    [openChat],
  );

  const handleSelectGroup = useCallback(
    (groupId: string, name: string) => {
      useConversationStore.getState().createConversation(groupId, name, '', 'group');
      useConversationStore.getState().setActivePeer(groupId);
      openChat(groupId);
      setSidebarTab('chats');
    },
    [openChat],
  );

  // 搜索：好友 ID/昵称 → 拉资料并开聊
  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword) return;
      try {
        const res = await getProfile(keyword);
        if (res.data) {
          const p = res.data;
          useConversationStore.getState().createConversation(p.userId, p.nickname, p.avatar, 'c2c');
          useConversationStore.getState().setActivePeer(p.userId);
          openChat(p.userId);
        }
      } catch (err) {
        console.error('搜索用户失败:', err);
      }
    },
    [openChat],
  );

  const tabClass = (tab: string) =>
    `flex-1 py-2 text-sm transition-colors ${
      sidebarTab === tab ? 'text-primary border-b-2 border-primary font-medium' : 'text-text-sub hover:text-text-main'
    }`;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* 个人卡（参考产品：面板顶部） */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-line">
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium">
            {user?.nickname?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-text-main truncate">{user?.nickname || '用户'}</span>
          <span className="text-xs text-text-sub">
            {connState === 'connected' ? '● 已连接' : connState === 'connecting' ? '连接中...' : '未连接'}
          </span>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-line bg-panel">
        <button onClick={() => setSidebarTab('chats')} className={tabClass('chats')}>聊天</button>
        <button onClick={() => setSidebarTab('groups')} className={tabClass('groups')}>群聊</button>
        <button onClick={() => setSidebarTab('friends')} className={tabClass('friends')}>好友</button>
      </div>

      {/* chats tab：搜索 + 添加好友 + 会话列表 */}
      {sidebarTab === 'chats' && (
        <>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white text-lg hover:bg-primary-dark transition-colors flex-shrink-0"
              title="添加好友"
            >
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
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
        </>
      )}

      {sidebarTab === 'groups' && (
        <GroupPanel activeGroupId={activePeerId} onSelect={handleSelectGroup} />
      )}

      {sidebarTab === 'friends' && (
        <>
          <div className="px-2 py-2 border-b border-line">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full py-1.5 text-sm rounded bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              发起群聊
            </button>
          </div>
          <FriendsPanel onChatWithFriend={handleChatWithFriend} />
        </>
      )}

      {/* 底部：连接状态 + 退出 */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-line bg-panel">
        <span className={`text-xs flex items-center gap-1 ${connState === 'connected' ? 'text-ok' : 'text-danger'}`}>
          ● {connState === 'connected' ? '通信正常' : connState === 'connecting' ? '连接中' : '通信中断'}
        </span>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-xs text-text-sub hover:text-danger px-2 py-1 transition-colors"
          title="退出登录"
        >
          退出
        </button>
      </div>

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 z-[10000] flex items-center justify-center" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-panel rounded-lg shadow-xl w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-5 text-center">
              <p className="text-sm text-text-main">确认退出登录吗？</p>
            </div>
            <div className="flex border-t border-line">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-sm text-text-sub hover:bg-bg-page border-r border-line transition-colors"
              >
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
        </div>
      )}

      <AddFriendDialog open={showAddFriend} onClose={() => setShowAddFriend(false)} />
      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(groupId, name) => {
          useConversationStore.getState().createConversation(groupId, name, '', 'group');
          useConversationStore.getState().setActivePeer(groupId);
          openChat(groupId);
          setSidebarTab('chats');
          setShowCreateGroup(false);
        }}
      />
    </div>
  );
}
```

注意：`GroupPanel` 的 `activeGroupId` 原值为 `activeConversation?.type === 'group' ? activePeerId : null`——窗口化后高亮语义放宽为 `activePeerId`（仅影响列表高亮色，可接受）。

- [ ] **Step 2: 实现 `src/components/ChatWindowContent/index.tsx`**

```tsx
import { useCallback, useState } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useConnStore } from '@/stores/useConnStore';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { ConnectionBanner } from '@/components/ConnectionBanner';

interface ReadStatus {
  readers: Array<{ userId: string; nickname: string; avatar: string }>;
  loading: boolean;
}

export function ChatWindowContent({ peerId }: { peerId: string }) {
  const s = useChatSession(peerId);
  const connState = useConnStore((st) => st.state);
  const [readStatus, setReadStatus] = useState<ReadStatus | null>(null);

  // 点击群消息已读圈 → 查询已读用户列表
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
    <>
      <ConnectionBanner
        state={connState}
        onReconnect={() => useConnStore.getState().requestReconnect()}
      />
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
        disabled={connState !== 'connected'}
      />

      {/* 群消息已读成员弹窗 */}
      {readStatus && (
        <div className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center" onClick={() => setReadStatus(null)}>
          <div className="bg-panel rounded-lg shadow-xl w-[260px] max-h-[360px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line text-sm font-medium text-text-main">已读成员</div>
            <div className="flex-1 overflow-y-auto p-2">
              {readStatus.loading ? (
                <div className="text-center text-xs text-text-sub py-4">加载中...</div>
              ) : readStatus.readers.length === 0 ? (
                <div className="text-center text-xs text-text-sub py-4">暂无已读</div>
              ) : (
                readStatus.readers.map((r) => (
                  <div key={r.userId} className="flex items-center gap-2 px-2 py-2 hover:bg-bg-page rounded">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                      {(r.nickname || r.userId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-text-main">{r.nickname || r.userId}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: 验证 + Commit**

Run: `npm test && npm run lint && npm run build`
Expected: 全绿（组件暂未被引用）

```bash
git add src/components/MainPanel src/components/ChatWindowContent
git commit -m "feat: MainPanel 主面板与 ChatWindowContent 聊天窗内容组件"
```

---

### Task 7: `TopNavBar` + `WindowLayer` + ChatPage 工作台重构（接线）

**Files:**
- Create: `src/components/TopNavBar/index.tsx`
- Create: `src/components/window/WindowLayer.tsx`
- Modify: `src/pages/Chat/index.tsx`（整体重写）

**Interfaces:**
- Consumes: 前面全部任务
- Produces: 完整工作台页面。窗口尺寸常量：主面板 `300×620`，聊天窗 `780×540`

- [ ] **Step 1: 实现 `src/components/TopNavBar/index.tsx`**

```tsx
import { useWindowStore } from '@/stores/useWindowStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';

export function TopNavBar() {
  const { totalUnread } = useUnreadCount();
  const openMain = useWindowStore((s) => s.openMain);

  return (
    <div className="h-12 bg-topbar flex items-center justify-between px-4 relative z-[1]">
      <div className="flex items-center gap-2 text-white font-medium">
        <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm">柚</span>
        Pomelo Chat
      </div>
      <button
        onClick={openMain}
        className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base"
        title="消息"
      >
        💬
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] leading-[18px] text-center">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 实现 `src/components/window/WindowLayer.tsx`**

```tsx
import { WinInfo, useWindowStore } from '@/stores/useWindowStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { DraggableWindow } from './DraggableWindow';
import { MainPanel } from '@/components/MainPanel';
import { ChatWindowContent } from '@/components/ChatWindowContent';

const MAIN_W = 300;
const MAIN_H = 620;
const CHAT_W = 780;
const CHAT_H = 540;

function MainWindow({ win }: { win: WinInfo }) {
  return (
    <DraggableWindow win={win} width={MAIN_W} height={MAIN_H} title="消息">
      <MainPanel />
    </DraggableWindow>
  );
}

function ChatWindow({ win }: { win: WinInfo }) {
  const peerId = win.peerId!;
  const nickname = useConversationStore((s) => s.conversations[peerId]?.nickname ?? peerId);
  const isGroup = useConversationStore((s) => s.conversations[peerId]?.type === 'group');
  const memberCount = useGroupStore((s) => (isGroup ? s.groupMembers[peerId]?.length : undefined));

  return (
    <DraggableWindow
      win={win}
      width={CHAT_W}
      height={CHAT_H}
      title={
        <span className="flex items-center gap-2">
          {nickname}
          {isGroup && <span className="text-xs font-normal opacity-80">群聊{memberCount ? ` · ${memberCount}人` : ''}</span>}
        </span>
      }
    >
      <ChatWindowContent peerId={peerId} />
    </DraggableWindow>
  );
}

export function WindowLayer() {
  const windows = useWindowStore((s) => s.windows);
  return (
    <>
      {windows.map((w) =>
        w.kind === 'main' ? <MainWindow key={w.id} win={w} /> : <ChatWindow key={w.id} win={w} />,
      )}
    </>
  );
}
```

- [ ] **Step 3: 重写 `src/pages/Chat/index.tsx`**

```tsx
import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIMClient } from '@/hooks/useIMClient';
import { useChatStore } from '@/stores/useChatStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useConnStore } from '@/stores/useConnStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { TopNavBar } from '@/components/TopNavBar';
import { WindowLayer } from '@/components/window/WindowLayer';

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { connect, disconnect, errorMessage, kickedReason } = useIMClient();
  const { totalUnread } = useUnreadCount();

  // 页面加载时连接 IM（useIMClient 仅此处调用——它有卸载断连副作用）
  useEffect(() => {
    if (user && token) {
      connect(user.userId, token, user.userName, user.nickname);
    }
  }, [user, token, connect]);

  // 进入工作台自动打开主面板窗
  useEffect(() => {
    useWindowStore.getState().openMain();
  }, []);

  // 未读计数更新 title
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) Pomelo Chat` : 'Pomelo Chat';
  }, [totalUnread]);

  // 断线重连（窗口内 ConnectionBanner 通过 useConnStore 触发）
  const handleReconnect = useCallback(() => {
    if (user && token) {
      disconnect();
      setTimeout(() => connect(user.userId, token, user.userName, user.nickname), 300);
    }
  }, [user, token, disconnect, connect]);

  useEffect(() => {
    useConnStore.getState().setReconnect(handleReconnect);
    return () => {
      useConnStore.getState().setReconnect(null);
    };
  }, [handleReconnect]);

  // 退出登录（MainPanel 底栏通过 useConnStore 触发）
  const handleLogout = useCallback(() => {
    // 1. 先断开 WebSocket（避免状态清除后还有事件回调修改 state）
    disconnect();
    // 2. 清理所有用户状态（消息、会话、好友、群、窗口）
    useChatStore.getState().clearAll();
    useConversationStore.getState().clearAll();
    useFriendStore.getState().clearAll();
    useGroupStore.getState().clearAll();
    useWindowStore.getState().clearAll();
    // 3. 清除认证状态 → ProtectedRoute 自动跳转 /login
    useAuthStore.getState().logout();
  }, [disconnect]);

  useEffect(() => {
    useConnStore.getState().setLogout(handleLogout);
    return () => {
      useConnStore.getState().setLogout(null);
    };
  }, [handleLogout]);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-bg-page">
      {/* 背景装饰层（预留业务嵌入） */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DBE7FB] via-bg-page to-[#E8EEFB]" />

      <TopNavBar />

      {/* 错误提示 toast */}
      {errorMessage && (
        <div className="fixed top-16 right-4 bg-danger text-white px-4 py-2 rounded-lg shadow-lg z-[9999]">
          {errorMessage}
        </div>
      )}
      {/* 被踢下线提示 */}
      {kickedReason && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-warn text-white px-4 py-2 rounded-lg shadow-lg z-[9999]">
          已下线：{kickedReason}
        </div>
      )}

      {/* 浮动窗口层 */}
      <WindowLayer />
    </div>
  );
}
```

主面板的"退出"按钮 → 确认弹窗 → 确认后调 `useConnStore.requestLogout()`（弹窗已内聚在 Task 6 的 MainPanel 中）；ChatPage 通过 `setLogout(handleLogout)` 注册实际登出逻辑。ChatPage 本身**不持有**退出确认弹窗（无 `showLogoutConfirm` state）。

- [ ] **Step 4: 全量验证**

Run: `npm test && npm run lint && npm run build`
Expected: 全绿

- [ ] **Step 5: Commit**

```bash
git add src/components/TopNavBar src/components/window/WindowLayer.tsx src/pages/Chat/index.tsx
git commit -m "feat: ChatPage 重构为浮动多窗工作台（背景+顶栏+WindowLayer）"
```

---

### Task 8: 全量验收与修整

**Files:**
- Modify: 按验收发现的样式/交互问题微调（预计涉及 Task 1-7 产物）

- [ ] **Step 1: 自动化验证**

Run: `npm test && npm run lint && npm run build`
Expected: 全绿

- [ ] **Step 2: 手动验收清单（`npm run dev`，双浏览器窗口互发消息）**

逐项验证，任何一项失败即修复后重跑：

1. 登录后：背景工作台 + 顶部深色导航条 + 主面板窗自动打开
2. 主面板：三个 tab 切换正常；点会话 → 弹出独立聊天窗，未读清零
3. 多窗：连续打开 3 个会话窗，位置级联不重叠、各自独立拖动
4. 拖动：标题栏拖动流畅；拖出边界被钳制（左/右留 80px、上 0、下留 40px）；点击窗口置顶
5. 全屏：⛶ 切换全屏/还原；双击标题栏同样生效；✕ 关闭窗口
6. 关闭主面板 → 右上角 💬 按钮点击重新打开；未读 badge 数字正确（>99 显示 99+）
7. 单聊：发文本/图片/文件/语音/视频/emoji 全部正常；对方收到；已读回执正常（对方已读圈变化）
8. 群聊：创建群、群消息收发、群 ACK（他人消息最大 seq）、已读成员弹窗正常
9. 历史加载：聊天窗滚到顶部触发加载更早消息；无更多时停止
10. 草稿：窗口内输入文字 → 关窗 → 重开会话，草稿回填
11. 断线：停掉后端 → 聊天窗顶部出现 ConnectionBanner、主面板底部变红"通信中断"、输入框禁用；恢复后端 → 自动重连、点"点击重连"按钮可用
12. 退出：主面板退出按钮 → 确认弹窗 → 确认后跳登录页；重新登录无残留窗口、无残留消息
13. 消息失败重试：断网发送 → 消息红色失败态 → 恢复后点重试成功
14. 窗口未读：A 窗口打开时 B 会话来消息 → 只有 B 计未读；打开 B 窗后 B 未读清零

- [ ] **Step 3: 修复发现的问题并单独 commit**

```bash
git add -A
git commit -m "fix: P1 窗口架构验收问题修整"
```

- [ ] **Step 4: 收尾**

Run: `git log --oneline main..HEAD`
Expected: 8 个左右干净提交；`npm run build` 通过，可发起 PR。

---

## 计划外显式记录（不在 P1，防功能"静默丢失"争议）

- 会话内消息搜索：从侧栏移除，P2 移入聊天窗
- ChatDetailPanel（右栏好友信息/群资料）：P2/P3
- 消息右键菜单/撤回/引用/转发/@/快捷回复：P2
- 位置/名片/群公告/转让解散/好友备注：P3
