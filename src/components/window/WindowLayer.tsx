import { WinInfo, useWindowStore } from '@/stores/useWindowStore';
import { DraggableWindow } from './DraggableWindow';
import { MainPanel } from '@/components/MainPanel';
import { ChatWindowContent } from '@/components/ChatWindowContent';
import { ChatWindowHeader } from '@/components/ChatWindowHeader';

const MAIN_W = 300;
const MAIN_H = 620;
const CHAT_W = 780;
const CHAT_H = 560;

function MainWindow({ win }: { win: WinInfo }) {
  return (
    <DraggableWindow win={win} width={MAIN_W} height={MAIN_H} title="消息">
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
