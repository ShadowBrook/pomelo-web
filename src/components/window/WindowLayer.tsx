import { MAIN_PANEL_WIDTH, WinInfo, useWindowStore } from '@/stores/useWindowStore';
import { DraggableWindow } from './DraggableWindow';
import { MainPanel } from '@/components/MainPanel';
import { ChatWindowContent } from '@/components/ChatWindowContent';
import { ChatWindowHeader } from '@/components/ChatWindowHeader';
import { UserCardTitle } from '@/components/UserCardTitle';

const MAIN_H = 580;
const CHAT_W = 780;
const CHAT_H = 580;

function MainWindow({ win, docked }: { win: WinInfo; docked: boolean }) {
  return (
    <DraggableWindow
      win={win}
      width={MAIN_PANEL_WIDTH}
      height={MAIN_H}
      title=""
      barClassName="h-12"
      headerContent={<UserCardTitle />}
      hideControls
      snapRight={docked}
    >
      <MainPanel />
    </DraggableWindow>
  );
}

function ChatWindow({ win }: { win: WinInfo }) {
  const peerId = win.peerId!;
  return (
    <DraggableWindow
      win={win}
      width={CHAT_W}
      height={CHAT_H}
      title=""
      barClassName="h-12"
      headerContent={<ChatWindowHeader peerId={peerId} />}
      snapLeft={!!win.snapped}
    >
      <ChatWindowContent peerId={peerId} />
    </DraggableWindow>
  );
}

export function WindowLayer() {
  const windows = useWindowStore((s) => s.windows);
  const docked = windows.some((w) => w.kind === 'chat' && w.snapped);
  return (
    <>
      {windows.map((w) =>
        w.kind === 'main' ? <MainWindow key={w.id} win={w} docked={docked} /> : <ChatWindow key={w.id} win={w} />,
      )}
    </>
  );
}
