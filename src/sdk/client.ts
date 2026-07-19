import { encode, decode, generateId } from './protocol';
import {
  Cmd,
  MsgType,
  AckType,
  ConnectionState,
  OutgoingMessage,
  IncomingMessage,
  IMClientEvents,
  SearchUserResp,
  FriendOpResp,
  FriendNotify,
  FriendDeleteNotify,
} from './types';

interface IMClientOptions {
  url: string;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class IMClient {
  private ws: WebSocket | null = null;
  private userId: string = '';
  private token: string = '';
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private url: string;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private pongMissCount: number = 0;
  // Fix 3：保存重连定时器，便于 disconnect 清理
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  // Fix 5：主动断开标志，阻止 onclose 触发虚假重连/error
  private intentionallyDisconnected: boolean = false;

  // 发送队列
  private pendingQueue: Map<string, OutgoingMessage> = new Map();

  // ACK 批量聚合（Fix 6：改 Set 去重）
  private receivedBuffer: Set<string> = new Set();
  private ackTimer: ReturnType<typeof setTimeout> | null = null;

  // Fix 7：已接收消息 ID 去重，避免重复计数
  private receivedMessageIds: Set<string> = new Set();

  // 好友操作待处理 Map：messageId -> { resolve, reject, timeoutId, expectedCmd }
  // 好友操作无 ACK 机制，使用 messageId 关联请求和响应，5 秒超时
  private pendingFriendOps: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason: any) => void;
      timeoutId: ReturnType<typeof setTimeout>;
      expectedCmd: Cmd;
    }
  > = new Map();

  // 事件系统
  private handlers: { [K in keyof IMClientEvents]?: IMClientEvents[K][] } = {};

  // 连接状态
  private state: ConnectionState = 'disconnected';

  // 最后收到的 seq（用于 Pull）
  private lastSeq: number = 0;

  // 重连延迟参数
  private readonly reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private readonly maxRetries = 3;
  private readonly baseTimeout = 5000;
  private readonly batchWindow = 200;

  constructor(options: IMClientOptions) {
    this.url = options.url;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
  }

  // ================================================================
  // Public API
  // ================================================================

  async connect(userId: string, token: string): Promise<void> {
    this.userId = userId;
    this.token = token;
    // Fix 5：连接时重置主动断开标志
    this.intentionallyDisconnected = false;

    return new Promise<void>((resolve, reject) => {
      try {
        this._setState('connecting');
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = async () => {
          try {
            this._authenticate();
            this.connected = true;
            this.reconnectAttempts = 0;
            this._setState('connected');
            this._startHeartbeat();
            this._pullOfflineMessages();
            this._resendPending();
            resolve();
          } catch (e) {
            reject(e);
          }
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this._onWsMessage(event);
        };

        this.ws.onclose = () => {
          this.connected = false;
          this._stopHeartbeat();
          // Fix 4：清理所有发送定时器，避免重连期间触发 InvalidStateError
          for (const [, msg] of this.pendingQueue) {
            if (msg.timer) {
              clearTimeout(msg.timer);
              msg.timer = undefined;
            }
          }
          // Fix 5：主动断开不再触发重连
          if (this.intentionallyDisconnected) return;
          this._setState('disconnected');
          this._tryReconnect();
        };

        this.ws.onerror = () => {
          this._emit('error', new Error('WebSocket error'));
          reject(new Error('WebSocket error'));
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  disconnect(): void {
    // Fix 5：置位主动断开标志
    this.intentionallyDisconnected = true;
    this.maxReconnectAttempts = 0;
    this._stopHeartbeat();

    // Fix 3：清理重连定时器，避免 disconnect 后连接“复活”
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 清理 ack 批量定时器
    if (this.ackTimer) {
      clearTimeout(this.ackTimer);
      this.ackTimer = null;
    }

    // 将 pending 中的消息标记为 failed
    for (const [id, msg] of this.pendingQueue) {
      if (msg.timer) clearTimeout(msg.timer);
      this.pendingQueue.delete(id);
      msg.status = 'failed';
      this._emit('statusChange', { id: msg.id, status: 'failed' });
    }

    // 清理待处理的好友操作
    for (const [, pending] of this.pendingFriendOps) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('连接已断开'));
    }
    this.pendingFriendOps.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this._setState('disconnected');
  }

  sendMessage(params: { recipientId: string; msgType: MsgType; content: string }): string {
    if (!this.connected) throw new Error('Not connected');

    const msgId = generateId();
    const msg: OutgoingMessage = {
      id: msgId,
      recipientId: params.recipientId,
      msgType: params.msgType,
      content: params.content,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.pendingQueue.set(msgId, msg);
    this._flush();
    return msgId;
  }

  markSeen(messageIds: string[]): void {
    if (!this.connected) return;
    this._sendAck(messageIds, AckType.SEEN);
  }

  /** Fix 8：重发 failed 状态的消息 */
  retrySend(messageId: string): void {
    const msg = this.pendingQueue.get(messageId);
    if (msg && msg.status === 'failed') {
      msg.status = 'pending';
      msg.retryCount = 0;
      if (msg.timer) {
        clearTimeout(msg.timer);
        msg.timer = undefined;
      }
      this._send(msg);
    }
  }

  on<K extends keyof IMClientEvents>(event: K, handler: IMClientEvents[K]): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    (this.handlers[event] as IMClientEvents[K][]).push(handler);
  }

  off<K extends keyof IMClientEvents>(event: K, handler: IMClientEvents[K]): void {
    if (!this.handlers[event]) return;
    const list = this.handlers[event] as IMClientEvents[K][];
    const idx = list.indexOf(handler);
    if (idx !== -1) list.splice(idx, 1);
  }

  getState(): ConnectionState {
    return this.state;
  }

  // ================================================================
  // Friend Operations
  // ================================================================

  /**
   * 发送好友操作请求并等待响应
   * 不进入发送队列、不重试（好友操作无 ACK 机制），使用 messageId 关联请求和响应，5 秒超时
   */
  private _sendFriendOp<T>(
    reqCmd: Cmd,
    respCmd: Cmd,
    body: Record<string, unknown>,
    idPrefix: string,
    timeoutMs = 5000,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket 未连接'));
        return;
      }
      const messageId = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timeoutId = setTimeout(() => {
        this.pendingFriendOps.delete(messageId);
        reject(new Error('操作超时'));
      }, timeoutMs);
      this.pendingFriendOps.set(messageId, { resolve, reject, timeoutId, expectedCmd: respCmd });
      const buf = encode(reqCmd, messageId, body, this.userId);
      this.ws!.send(buf);
    });
  }

  /** 搜索用户 */
  searchUsers(keyword: string): Promise<SearchUserResp> {
    return this._sendFriendOp<SearchUserResp>(
      Cmd.FRIEND_SEARCH_REQ,
      Cmd.FRIEND_SEARCH_RESP,
      { keyword },
      'search',
    );
  }

  /** 添加好友 */
  addFriend(friendId: string): Promise<FriendOpResp> {
    return this._sendFriendOp<FriendOpResp>(
      Cmd.FRIEND_ADD_REQ,
      Cmd.FRIEND_ADD_RESP,
      { userId: this.userId, friendId },
      'add',
    );
  }

  /** 接受好友申请（friendId 是申请发起方） */
  acceptFriend(friendId: string): Promise<FriendOpResp> {
    return this._sendFriendOp<FriendOpResp>(
      Cmd.FRIEND_ACCEPT_REQ,
      Cmd.FRIEND_ACCEPT_RESP,
      { userId: this.userId, friendId },
      'accept',
    );
  }

  /** 删除好友 */
  deleteFriend(friendId: string): Promise<FriendOpResp> {
    return this._sendFriendOp<FriendOpResp>(
      Cmd.FRIEND_DELETE_REQ,
      Cmd.FRIEND_DELETE_RESP,
      { userId: this.userId, friendId },
      'delete',
    );
  }

  // ================================================================
  // Connection & Heartbeat
  // ================================================================

  private _authenticate(): void {
    const body = {
      token: this.token,
      userId: this.userId,
      deviceId: 'web',
      platform: 'web',
      appVersion: '1.0.0',
    };
    const buf = encode(Cmd.AUTH_REQ, 'auth-' + Date.now(), body, this.userId);
    this.ws!.send(buf);
  }

  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this.pongMissCount = 0;
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const buf = encode(Cmd.PING, 'ping-' + Date.now(), { clientTime: Date.now() }, this.userId);
        this.ws.send(buf);

        // PONG 超时检测：10s 内未收到 PONG 则计数
        if (this.pongTimer) clearTimeout(this.pongTimer);
        this.pongTimer = setTimeout(() => {
          this.pongMissCount++;
          console.warn(`[IMClient] PONG 超时 (${this.pongMissCount}/3)`);
          if (this.pongMissCount >= 3) {
            console.warn('[IMClient] 连续 3 次 PONG 超时，主动断开重连');
            if (this.ws) this.ws.close();
          }
        }, 10000);
      }
    }, this.heartbeatInterval);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private async _tryReconnect(): Promise<void> {
    // Fix 5：主动断开不再重连
    if (this.intentionallyDisconnected) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[IMClient] 重连次数已达上限');
      this._setState('disconnected');
      this._emit('error', new Error('重连次数已达上限'));
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay,
    );
    this.reconnectAttempts++;
    this._setState('reconnecting');
    console.log(
      `[IMClient] 重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts}) 等待 ${delay}ms...`,
    );

    // Fix 3：保存 timer 以便 disconnect 清理
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      // Fix 5：双重检查，定时器触发时可能已主动断开
      if (this.intentionallyDisconnected) return;
      try {
        await this.connect(this.userId, this.token);
      } catch {
        // 连接失败，继续重连
        this._tryReconnect();
      }
    }, delay);
  }

  // ================================================================
  // Send Queue
  // ================================================================

  private _flush(): void {
    for (const [, msg] of this.pendingQueue) {
      if (msg.status === 'pending') {
        this._send(msg);
      }
    }
  }

  private _send(msg: OutgoingMessage): void {
    // Fix 4：readyState 守卫，连接未就绪时保留在队列等重连后 _resendPending 处理
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      msg.status = 'pending';
      return;
    }

    msg.status = 'sending';

    const body = {
      senderId: this.userId,
      recipientId: msg.recipientId,
      message: { msgType: msg.msgType, content: msg.content },
    };

    const buf = encode(Cmd.C2C_REQ, msg.id, body, this.userId);
    ws.send(buf);

    this._startSendTimer(msg);
    this._emit('statusChange', { id: msg.id, status: msg.status });
  }

  private _startSendTimer(msg: OutgoingMessage): void {
    if (msg.timer) clearTimeout(msg.timer);
    const delay = this.baseTimeout * Math.pow(2, msg.retryCount);
    msg.timer = setTimeout(() => {
      if (msg.retryCount < this.maxRetries) {
        msg.retryCount++;
        console.log(`[IMClient] 重试发送 msgId=${msg.id} (第 ${msg.retryCount} 次)`);
        this._send(msg);
      } else {
        this.pendingQueue.delete(msg.id);
        msg.status = 'failed';
        console.warn(`[IMClient] 发送失败 msgId=${msg.id}，已重试 ${this.maxRetries} 次`);
        this._emit('statusChange', { id: msg.id, status: 'failed' });
      }
    }, delay);
  }

  private _resendPending(): void {
    for (const [, msg] of this.pendingQueue) {
      if (msg.timer) clearTimeout(msg.timer);
      msg.retryCount = 0;
      msg.status = 'pending';
      this._send(msg);
    }
  }

  // ================================================================
  // Response Handlers
  // ================================================================

  private _onC2CResp(messageId: string, body: any): void {
    const msg = this.pendingQueue.get(messageId);
    if (msg) {
      if (msg.timer) {
        clearTimeout(msg.timer);
        msg.timer = undefined;
      }
      // Fix 2：不再 delete，保留以接收后续 ACK_NOTIFY（delivered/seen）
      msg.status = 'sent';
      this._emit('statusChange', {
        id: msg.id,
        status: 'sent',
        seq: body?.seq,
      });
    }
  }

  private _onAckNotify(body: any): void {
    if (!body || !body.messageIds) return;
    const messageIds: (string | number)[] = body.messageIds;
    const ackType: number = body.ackType;

    for (const rawId of messageIds) {
      const id = String(rawId);
      const msg = this.pendingQueue.get(id);
      if (!msg) continue;

      if (ackType === AckType.SEEN) {
        msg.status = 'seen';
        this._emit('statusChange', { id: msg.id, status: 'seen' });
        // Fix 2：seen 是终态，可以删除
        this.pendingQueue.delete(msg.id);
      } else if (ackType === AckType.RECEIVED && msg.status === 'sent') {
        msg.status = 'delivered';
        this._emit('statusChange', { id: msg.id, status: 'delivered' });
      }
    }
  }

  // ================================================================
  // ACK Automaton
  // ================================================================

  private _onMessageReceived(body: any): void {
    const msg: IncomingMessage = {
      id: String(body.id || ''),
      senderId: body.senderId || '',
      recipientId: body.recipientId || '',
      msgType: body.message?.msgType ?? body.msgType ?? MsgType.TEXT,
      content: body.message?.content ?? body.content ?? '',
      seq: body.seq || 0,
      createdAt: body.createdAt || Date.now(),
    };

    // Fix 7：去重，避免重复消息触发多次 message 事件导致未读数重复计数
    if (this.receivedMessageIds.has(msg.id)) return;
    this.receivedMessageIds.add(msg.id);

    if (msg.seq > this.lastSeq) this.lastSeq = msg.seq;

    this._emit('message', msg);

    // Fix 6：Set 去重聚合
    this.receivedBuffer.add(msg.id);
    this._scheduleBatchAck();
  }

  private _scheduleBatchAck(): void {
    if (this.ackTimer) return;
    this.ackTimer = setTimeout(() => {
      this.ackTimer = null;
      // Fix 6：Set 操作，天然去重
      if (this.receivedBuffer.size === 0) return;
      const ids = Array.from(this.receivedBuffer);
      this.receivedBuffer.clear();
      this._sendAck(ids, AckType.RECEIVED);
    }, this.batchWindow);
  }

  private _sendAck(messageIds: string[], ackType: AckType): void {
    const body = {
      messageIds: messageIds.map(Number),
      ackType,
    };
    const buf = encode(Cmd.ACK_REQ, 'ack-' + Date.now(), body, this.userId);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(buf);
      console.log(
        `[IMClient] ACK: ${messageIds.length} msgs, type=${ackType === AckType.RECEIVED ? 'RECEIVED' : 'SEEN'}`,
      );
    }
  }

  // ================================================================
  // Pull Offline Messages
  // ================================================================

  private _pullOfflineMessages(): void {
    if (!this.connected) return;
    const body = {
      userId: this.userId,
      lastMsgId: this.lastSeq,
      limit: 50,
    };
    const buf = encode(Cmd.PULL_REQ, 'pull-' + Date.now(), body, this.userId);
    this.ws!.send(buf);
    console.log(`[IMClient] Pull 离线消息 lastMsgId=${this.lastSeq}`);
  }

  private _onPullResp(body: any): void {
    console.log(`[IMClient] Pull 响应: hasMore=${body?.hasMore}, code=${body?.code}`);
    // Fix 1：处理 PULL_RESP body 中的消息列表，否则离线消息被丢弃
    const messages: any[] = body?.messages ?? body?.list ?? [];
    for (const record of messages) {
      // 即使消息被 _onMessageReceived 去重也要推进 lastSeq，避免死循环
      if (record.seq && record.seq > this.lastSeq) {
        this.lastSeq = record.seq;
      }
      // 复用 _onMessageReceived 的归一化与去重逻辑派发到 UI
      this._onMessageReceived(record);
    }
    // 继续拉取（lastSeq 已更新，不会死循环）
    if (body?.hasMore) {
      this._pullOfflineMessages();
    }
  }

  // ================================================================
  // Message Dispatch
  // ================================================================

  private _dispatchMessage(cmd: number, messageId: string, body: any): void {
    // 处理好友操作的错误响应（cmd=400/409/500，body 是纯字符串）
    // 错误响应的 cmd 为 HTTP 风格状态码，body 为 UTF-8 字符串（非 JSON），需在 switch 之前拦截避免 JSON.parse 抛异常
    if (cmd === 400 || cmd === 409 || cmd === 500) {
      const errorMessage = typeof body === 'string' ? body : JSON.stringify(body);
      const pending = this.pendingFriendOps.get(messageId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.pendingFriendOps.delete(messageId);
        pending.reject(new Error(errorMessage));
      } else {
        // 未找到对应的 pending，作为通用错误事件
        this._emit('error', new Error(errorMessage));
      }
      return;
    }

    switch (cmd) {
      case Cmd.AUTH_RESP:
        console.log('[IMClient] 认证成功');
        break;

      case Cmd.C2C_RESP:
        this._onC2CResp(messageId, body);
        break;

      case Cmd.C2C_NOTIFY:
        this._onMessageReceived(body ?? { id: messageId });
        break;

      case Cmd.PONG:
        if (this.pongTimer) {
          clearTimeout(this.pongTimer);
          this.pongTimer = null;
        }
        this.pongMissCount = 0;
        break;

      case Cmd.ACK_NOTIFY:
        this._onAckNotify(body);
        break;

      case Cmd.PULL_RESP:
        this._onPullResp(body ?? {});
        break;

      case Cmd.CTRL_NOTIFY:
        this._emit('kicked', body?.reason ?? '被踢下线');
        break;

      case Cmd.ACK_RESP:
        // ACK 已确认，无需处理
        break;

      // 好友操作响应
      case Cmd.FRIEND_SEARCH_RESP: {
        const resp = body as SearchUserResp;
        // 关联到 pendingFriendOps（通过 messageId）
        const pending = this.pendingFriendOps.get(messageId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          this.pendingFriendOps.delete(messageId);
          pending.resolve(resp);
        } else {
          // 未找到待处理请求，可能是重复响应，触发事件
          this._emit('searchResult', resp);
        }
        break;
      }
      case Cmd.FRIEND_ADD_RESP:
      case Cmd.FRIEND_ACCEPT_RESP:
      case Cmd.FRIEND_DELETE_RESP: {
        const resp = body as FriendOpResp;
        const pending = this.pendingFriendOps.get(messageId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          this.pendingFriendOps.delete(messageId);
          if (resp.code === 0) {
            pending.resolve(resp);
          } else {
            pending.reject(new Error(resp.message));
          }
        }
        break;
      }
      case Cmd.FRIEND_ADD_NOTIFY: {
        const notify = body as FriendNotify;
        this._emit('friendRequest', notify);
        break;
      }
      case Cmd.FRIEND_ACCEPT_NOTIFY: {
        const notify = body as FriendNotify;
        this._emit('friendAccepted', notify);
        break;
      }
      case Cmd.FRIEND_DELETE_NOTIFY: {
        const notify = body as FriendDeleteNotify;
        this._emit('friendDeleted', notify);
        break;
      }

      default:
        console.log('[IMClient] Unhandled cmd:', '0x' + cmd.toString(16), body);
    }
  }

  private _onWsMessage(event: MessageEvent): void {
    try {
      const { cmd, messageId, body } = decode(event.data as ArrayBuffer);
      this._dispatchMessage(cmd, messageId, body);
    } catch (e) {
      console.error('[IMClient] Decode error:', e);
    }
  }

  // ================================================================
  // Helpers
  // ================================================================

  private _emit<K extends keyof IMClientEvents>(
    event: K,
    ...args: Parameters<IMClientEvents[K]>
  ): void {
    const list = this.handlers[event];
    if (list) {
      for (const handler of list) {
        try {
          (handler as (...a: Parameters<IMClientEvents[K]>) => void)(...args);
        } catch (e) {
          console.error('[IMClient] Event handler error:', e);
        }
      }
    }
  }

  private _setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this._emit('connectionChange', state);
    }
  }
}
