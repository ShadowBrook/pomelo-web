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

describe('对接模式（snapped）', () => {
  beforeEach(reset);

  const openDocked = () => {
    useWindowStore.getState().openMain();
    useWindowStore.getState().openChat('a');
    return {
      main: useWindowStore.getState().windows.find((w) => w.id === MAIN_WINDOW_ID)!,
      chat: useWindowStore.getState().windows.find((w) => w.peerId === 'a')!,
    };
  };

  it('主面板开着时 openChat 吸附其右缘并标记 snapped', () => {
    const { main, chat } = openDocked();
    expect(chat.snapped).toBe(true);
    expect(chat.pos).toEqual({ x: main.pos.x + 300, y: main.pos.y });
  });

  it('主面板未开时 openChat 走级联且不吸附', () => {
    useWindowStore.getState().openChat('a');
    const chat = useWindowStore.getState().windows.find((w) => w.peerId === 'a')!;
    expect(chat.snapped).toBeFalsy();
    expect(chat.pos.x).toBe(200);
  });

  it('拖动聊天窗解除自身吸附', () => {
    const { chat } = openDocked();
    useWindowStore.getState().move(chat.id, { x: 500, y: 300 });
    expect(useWindowStore.getState().windows.find((w) => w.peerId === 'a')!.snapped).toBe(false);
  });

  it('拖动主面板解除全部聊天窗吸附', () => {
    openDocked();
    useWindowStore.getState().openChat('b');
    useWindowStore.getState().move(MAIN_WINDOW_ID, { x: 50, y: 60 });
    const chats = useWindowStore.getState().windows.filter((w) => w.kind === 'chat');
    expect(chats.map((w) => w.snapped)).toEqual([false, false]);
  });

  it('关闭主面板解除全部聊天窗吸附', () => {
    openDocked();
    useWindowStore.getState().close(MAIN_WINDOW_ID);
    const chats = useWindowStore.getState().windows.filter((w) => w.kind === 'chat');
    expect(chats.map((w) => w.snapped)).toEqual([false]);
  });
});
