import React from 'react';
import { ChatMessage } from '@/stores/useChatStore';

interface Props {
  message: ChatMessage;
  isSelf: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({ message, isSelf }: Props) {
  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      {/* 对方头像（非己方时显示在左侧） */}
      {!isSelf && (
        <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white text-xs mr-2">
          {message.senderId.charAt(0).toUpperCase()}
        </div>
      )}

      {/* 气泡 */}
      <div className={`max-w-[60%] px-3 py-2 rounded-lg text-sm break-words ${
        isSelf
          ? 'bg-wechat-bubble-self text-wechat-text rounded-tr-sm'
          : 'bg-wechat-bubble-other text-wechat-text border border-gray-200 rounded-tl-sm'
      }`}>
        {message.msgType === 1 && <p className="whitespace-pre-wrap">{message.content}</p>}
        {message.msgType === 2 && (
          <img src={message.content} alt="图片" className="max-w-full rounded cursor-pointer" style={{ maxHeight: 200 }} />
        )}
        {message.msgType === 4 && <p className="text-3xl">{message.content}</p>}
        {message.msgType === 3 && (
          <div className="flex items-center gap-2 p-2 bg-white/50 rounded">
            <span className="text-lg">📎</span>
            <span className="text-xs">{(() => { try { return JSON.parse(message.content).name } catch { return '文件' } })()}</span>
          </div>
        )}
      </div>

      {/* 己方头像 */}
      {isSelf && (
        <div className="w-9 h-9 rounded-full bg-wechat-green flex-shrink-0 flex items-center justify-center text-white text-xs ml-2">
          我
        </div>
      )}
    </div>
  );
});
