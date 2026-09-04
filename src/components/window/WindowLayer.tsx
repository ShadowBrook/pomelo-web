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
