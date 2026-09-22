import { encode, decode, generateId } from './protocol';
import { enc, plain, text, im } from './pbcodec';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';
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
  PullHistoryResp,
  GroupMessage,
  GroupInfo,
  GroupMember,
  GroupOpResp,
  CreateGroupResp,
  GroupMsgReadStatusResp,
  GroupReadStateResp,
  GroupMemberChangeNotify,
  UploadResp,
  UpdateProfileResp,
  CallEvent,
  CallInviteResp,
  CallJoinInfo,
  CallMediaType,
} from './types';

// MessageContent.content 是 protobuf bytes 字段，发送时必须传 utf8 编码的字节（不能直接传字符串，字符串会被当 base64）
const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

// GroupMemberChangeNotify.type 在 proto 中是枚举数字，映射回枚举名字符串
const GROUP_MEMBER_CHANGE_NAMES = [
  'INVITED',
  'JOINED',
  'LEFT',
  'KICKED',
  'ADMIN_SET',
  'OWNER_TRANSFERRED',
  'DISSOLVED',
  'INFO_UPDATED',
] as const;

interface IMClientOptions {
  url: string;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class IMClient {
  private ws: WebSocket | null = null;
  private userId: string = '';
  private userName: string = '';
  private nickname: string = '';
  private token: string = '';
  private connected: boolean = false;
  // 网关拒绝未认证连接的业务命令（仅放行 PING/AUTH_REQ），
  // 因此拉取/补发/业务请求必须等 AUTH_RESP 成功后才能发出
  private authed: boolean = false;
  // 等待认证完成的挂起请求（认证成功批量放行，断连/超时拒绝）
  private authWaiters: {
    resolve: () => void;
    reject: (e: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }[] = [];
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

  // 历史消息拉取待处理 Map：messageId -> { resolve, reject, timeoutId }
  // 复用 PULL_REQ/PULL_RESP 协议，通过 messageId 关联请求和响应，10 秒超时
  private pendingHistoryPulls: Map<
    string,
    {
      resolve: (value: PullHistoryResp) => void;
      reject: (reason: any) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  > = new Map();

  // 媒体上传预签名待处理 Map：messageId -> { resolve, reject, timeoutId }
  // 复用 CMD_UPLOAD_REQ/RESP，通过 messageId 关联请求和响应，10 秒超时
  private pendingUploads: Map<
    string,
    {
      resolve: (value: UploadResp) => void;
      reject: (reason: any) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  > = new Map();

  // 事件系统
  private handlers: { [K in keyof IMClientEvents]?: IMClientEvents[K][] } = {};

  // 连接状态
  private state: ConnectionState = 'disconnected';

  // 本账号已同步到的收件人 seq（同步水位；收到的消息都携带本账号的信箱 seq）
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

  async connect(userId: string, token: string, userName?: string, nickname?: string): Promise<void> {
    this.userId = userId;
    this.userName = userName || '';
    this.nickname = nickname || '';
    this.token = token;
    // Fix 5：连接时重置主动断开标志
    this.intentionallyDisconnected = false;
    // 每次新连接都需重新认证
    this.authed = false;

    return new Promise<void>((resolve, reject) => {
      try {
        let settled = false;
        this._setState('connecting');
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = async () => {
          if (settled) return;
          settled = true;
          try {
            this._authenticate();
            this.connected = true;
            this.reconnectAttempts = 0;
            this._setState('connected');
            this._startHeartbeat();
            // 离线拉取与队列补发延迟到 AUTH_RESP 成功后执行
            // （网关对未认证连接只放行 PING/AUTH_REQ，提前发会被 401 拒绝）
            resolve();
          } catch (e) {
            reject(e);
          }
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this._onWsMessage(event);
        };

        this.ws.onclose = (event: CloseEvent) => {
          this.connected = false;
          this.authed = false;
          this._stopHeartbeat();
          this._rejectAuthWaiters('连接已断开');
          for (const [, msg] of this.pendingQueue) {
            if (msg.timer) {
              clearTimeout(msg.timer);
              msg.timer = undefined;
            }
          }
          // 仅当 onopen 从未触发且 close code 是真异常时，才 reject Promise
          // code 1005/1006 是浏览器自身关闭（瞬态），resolve 不报错 — 由 _tryReconnect 接管
          if (!settled) {
            settled = true;
            if (!event.wasClean && event.code !== 1000 && event.code !== 1005 && event.code !== 1006) {
              const err = new Error('WebSocket connection failed: code=' + event.code);
              this._emit('error', err);
              reject(err);
            } else {
              resolve();
            }
          }
          if (this.intentionallyDisconnected) return;
          this._setState('disconnected');
          this._tryReconnect();
        };

        this.ws.onerror = () => {
          // onerror 后标准行为是 onclose，错误判断统一在 onclose 中通过 CloseEvent.code 处理
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
    this.authed = false;
    this._rejectAuthWaiters('连接已断开');

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

    // 清理待处理的历史拉取
    for (const [, pending] of this.pendingHistoryPulls) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('连接已断开'));
    }
    this.pendingHistoryPulls.clear();

    // 清理待处理的上传预签名
    for (const [, pending] of this.pendingUploads) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('连接已断开'));
    }
    this.pendingUploads.clear();

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
      kind: 'c2c',
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
   * body 为 pbcodec 编码好的 protobuf 字节。
   */
  private _sendFriendOp<T>(
    reqCmd: Cmd,
    respCmd: Cmd,
    body: Uint8Array,
    idPrefix: string,
    timeoutMs = 5000,
  ): Promise<T> {
    return this._whenAuthed().then(
      () =>
        new Promise<T>((resolve, reject) => {
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
        }),
    );
  }

  /** 搜索用户 */
  searchUsers(keyword: string): Promise<SearchUserResp> {
    return this._sendFriendOp<SearchUserResp>(
      Cmd.FRIEND_SEARCH_REQ,
      Cmd.FRIEND_SEARCH_RESP,
      enc(im.relation.SearchUserReq, { keyword }),
      'search',
    );
  }

  /** 添加好友 */
  addFriend(friendId: string): Promise<FriendOpResp> {
    return this._sendFriendOp<FriendOpResp>(
      Cmd.FRIEND_ADD_REQ,
      Cmd.FRIEND_ADD_RESP,
      enc(im.relation.FriendAddReq, { userId: this.userId, friendId }),
      'add',
    );
  }

  /** 接受好友申请（friendId 是申请发起方） */
  acceptFriend(friendId: string): Promise<FriendOpResp> {
    return this._sendFriendOp<FriendOpResp>(
      Cmd.FRIEND_ACCEPT_REQ,
      Cmd.FRIEND_ACCEPT_RESP,
      enc(im.relation.FriendAcceptReq, { userId: this.userId, friendId }),
      'accept',
    );
  }

  /** 删除好友 */
  deleteFriend(friendId: string): Promise<FriendOpResp> {
    return this._sendFriendOp<FriendOpResp>(
      Cmd.FRIEND_DELETE_REQ,
      Cmd.FRIEND_DELETE_RESP,
      enc(im.relation.FriendDeleteReq, { userId: this.userId, friendId }),
      'delete',
    );
  }

  // ================================================================
  // Call Operations（音视频通话信令；媒体直连 LiveKit，不经 IM 通道）
  // ================================================================

  /**
   * 发起通话，成功返回 callId。
   * 传数组即群聊通话（peer_ids，不含主叫；人数上限由服务端约束）；
   * groupId 为群聊通话的归属群，>0 时通话记录落群会话而非双方收件箱。
   */
  inviteCall(peerId: string | string[], mediaType: CallMediaType, groupId?: string): Promise<CallInviteResp> {
    const body = Array.isArray(peerId)
      ? { peerId: peerId[0], mediaType, peerIds: peerId.map((id) => Number(id)), groupId: Number(groupId ?? 0) }
      : { peerId, mediaType };
    return this._sendFriendOp<CallInviteResp>(
      Cmd.CALL_INVITE_REQ,
      Cmd.CALL_INVITE_RESP,
      enc(im.call.CallInviteReq, body),
      'call-invite',
      10000,
    );
  }

  /** 接听，返回入会三件套（room/token/wsUrl） */
  acceptCall(callId: string): Promise<CallJoinInfo> {
    return this._sendFriendOp<CallJoinInfo>(
      Cmd.CALL_ACCEPT_REQ,
      Cmd.CALL_ACCEPT_RESP,
      enc(im.call.CallAcceptReq, { callId }),
      'call-accept',
      10000,
    );
  }

  /** 结束通话（reason 由服务端按角色×状态裁定，客户端上报值仅参考） */
  endCall(callId: string, reason: number): Promise<FriendOpResp> {
    return this._sendFriendOp<FriendOpResp>(
      Cmd.CALL_END_REQ,
      Cmd.CALL_END_RESP,
      enc(im.call.CallEndReq, { callId, reason }),
      'call-end',
      5000,
    );
  }

  /** 断线重连：重新获取入会材料 */
  requestCallToken(callId: string): Promise<CallJoinInfo> {
    return this._sendFriendOp<CallJoinInfo>(
      Cmd.CALL_TOKEN_REQ,
      Cmd.CALL_TOKEN_RESP,
      enc(im.call.CallTokenReq, { callId }),
      'call-token',
      10000,
    );
  }

  /**
   * 拉取会话历史消息（通过 PULL_REQ/PULL_RESP，与离线拉取共用协议）。
   * 后端根据 varHeader 中是否有 peerId 区分：
   * - 有 peerId → 按 conversationId 拉取历史（created_at 倒序，只回退不前进）
   * - 无 peerId → 拉取离线未送达消息（seq > 收件人同步水位）
   *
   * @param beforeTime 时间游标：传入已拥有最旧消息的 createdAt，拉取更早一页；
   *                   0 / 不传 = 拉取最新一页。
   */
  pullHistory(peerId: string, beforeTime?: number, limit = 50): Promise<PullHistoryResp> {
    return this._whenAuthed().then(
      () =>
        new Promise<PullHistoryResp>((resolve, reject) => {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket 未连接'));
            return;
          }
          // PullReq proto 无 peerId/userId 字段；peerId 只能放 varHeader（encode 会自动带上 userId）
          const bodyBytes = enc(im.pull.PullReq, { seq: beforeTime || 0, limit });
          const messageId = `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const timeoutId = setTimeout(() => {
            this.pendingHistoryPulls.delete(messageId);
            reject(new Error('拉取历史消息超时'));
          }, 10000);
          this.pendingHistoryPulls.set(messageId, { resolve, reject, timeoutId });
          const buf = encode(Cmd.PULL_REQ, messageId, bodyBytes, this.userId, { peerId });
          this.ws.send(buf);
        }),
    );
  }

  // ================================================================
  // Media Upload
  // ================================================================

  /**
   * 申请上传预签名（CMD_UPLOAD_REQ/RESP）。
   * 通过 messageId 关联请求和响应，10 秒超时。
   * 成功后拿 objectKey + presigned PUT URL，客户端直传 MinIO。
   */
  requestUpload(mediaType: number, fileName: string, size: number, contentType?: string): Promise<UploadResp> {
    return this._whenAuthed().then(
      () =>
        new Promise<UploadResp>((resolve, reject) => {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket 未连接'));
            return;
          }
          const messageId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const timeoutId = setTimeout(() => {
            this.pendingUploads.delete(messageId);
            reject(new Error('获取上传预签名超时'));
          }, 10000);
          this.pendingUploads.set(messageId, { resolve, reject, timeoutId });
          const fields: Record<string, unknown> = { mediaType, fileName, size };
          if (contentType) {
            fields.contentType = contentType;
          }
          const buf = encode(Cmd.CMD_UPLOAD_REQ, messageId, enc(im.upload.UploadReq, fields), this.userId);
          this.ws.send(buf);
        }),
    );
  }

  /**
   * 文件字节直传 presigned PUT URL。
   * Content-Type 必须与预签名时的 content-type 完全一致（SigV4 签名包含该 header），
   * 否则 MinIO 返回 SignatureDoesNotMatch。
   * presigned URL 为 http 时改写为同源 /minio 代理（https 页面直连会被 Safari 按混合内容拦截）。
   */
  async putFileToPresignedUrl(
    presignedUrl: string,
    file: File,
    onProgress?: (sent: number, total: number) => void,
  ): Promise<void> {
    const url = sameOriginMediaUrl(presignedUrl);
    const contentType = file.type || 'application/octet-stream';

    if (!onProgress) {
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
      if (!resp.ok) {
        throw new Error(`上传文件失败: HTTP ${resp.status}`);
      }
      return;
    }

    // fetch 无法上报上传进度，需要进度时改走 XHR 的 upload.onprogress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`上传文件失败: HTTP ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('上传文件失败: 网络错误'));
      xhr.send(file);
    });
  }

  /**
   * 更新资料（CMD_PROFILE_UPDATE_REQ/RESP）。proto3 optional 语义：
   * 只传需要更新的字段（avatar 为先经 requestUpload/putFileToPresignedUrl
   * 直传的服务端对象 key，空串=清除）；响应回显读侧预签名后的值。
   */
  updateProfile(fields: { avatar?: string; signature?: string }): Promise<UpdateProfileResp> {
    const body: Record<string, string> = {};
    if (fields.avatar !== undefined) {
      body.avatar = fields.avatar;
    }
    if (fields.signature !== undefined) {
      body.signature = fields.signature;
    }
    if (Object.keys(body).length === 0) {
      return Promise.reject(new Error('updateProfile：avatar 与 signature 至少提供一个'));
    }
    return this._sendGroupOp(
      Cmd.CMD_PROFILE_UPDATE_REQ,
      Cmd.CMD_PROFILE_UPDATE_RESP,
      enc(im.profile.ProfileUpdateReq, body),
    ).then((raw: any) => ({
      code: raw?.code ?? 0,
      message: raw?.message ?? '',
      avatar: raw?.avatar || '',
      signature: raw?.signature || '',
    }));
  }

  /** 转让群主（仅群主；目标须为成员）。成员会收到 OWNER_TRANSFERRED 推送 */
  transferGroup(groupId: string, targetUserId: string): Promise<GroupOpResp> {
    return this._sendGroupOp(
      Cmd.CMD_GROUP_TRANSFER_REQ,
      Cmd.CMD_GROUP_TRANSFER_RESP,
      enc(im.group.TransferGroupReq, { groupId, targetUserId }),
    ).then((raw: any) => ({ code: raw?.code ?? 0, message: raw?.message ?? '' }));
  }

  /** 解散群聊（仅群主）。成员会收到 DISSOLVED 推送；历史消息保留 */
  dissolveGroup(groupId: string): Promise<GroupOpResp> {
    return this._sendGroupOp(
      Cmd.CMD_GROUP_DISSOLVE_REQ,
      Cmd.CMD_GROUP_DISSOLVE_RESP,
      enc(im.group.DissolveGroupReq, { groupId }),
    ).then((raw: any) => ({ code: raw?.code ?? 0, message: raw?.message ?? '' }));
  }

  /** 修改群名（群主/管理员）。全体成员的各端会收到 INFO_UPDATED 推送（含操作者自己的其他端） */
  updateGroupName(groupId: string, name: string): Promise<GroupOpResp> {
    return this.updateGroupInfo(groupId, { name });
  }

  /** 修改群公告（群主/管理员）；空串表示清空。全体成员的各端会收到 INFO_UPDATED */
  updateGroupDescription(groupId: string, description: string): Promise<GroupOpResp> {
    return this.updateGroupInfo(groupId, { description });
  }

  /** 修改群信息（群名/公告，未提供的字段保持不变）；群主/管理员 */
  updateGroupInfo(
    groupId: string,
    patch: { name?: string; description?: string },
  ): Promise<GroupOpResp> {
    const body: Record<string, unknown> = { groupId };
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.description !== undefined) body.description = patch.description;
    return this._sendGroupOp(
      Cmd.CMD_GROUP_UPDATE_REQ,
      Cmd.CMD_GROUP_UPDATE_RESP,
      enc(im.group.UpdateGroupReq, body),
    ).then((raw: any) => ({ code: raw?.code ?? 0, message: raw?.message ?? '' }));
  }

  // ================================================================
  // Group Operations
  // ================================================================

  /** body 为 pbcodec 编码好的 protobuf 字节。 */
  private _sendGroupOp<T>(reqCmd: Cmd, respCmd: Cmd, body: Uint8Array, timeoutMs = 5000): Promise<T> {
    return this._whenAuthed().then(
      () =>
        new Promise<T>((resolve, reject) => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket 未连接'));
            return;
          }
          const messageId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const timeoutId = setTimeout(() => {
            this.pendingFriendOps.delete(messageId);
            reject(new Error('操作超时'));
          }, timeoutMs);
          this.pendingFriendOps.set(messageId, { resolve, reject, timeoutId, expectedCmd: respCmd });
          const buf = encode(reqCmd, messageId, body, this.userId);
          this.ws!.send(buf);
        }),
    );
  }

  sendGroupMessage(groupId: string, msgType: MsgType, content: string, ext?: Record<string, string>): string {
    if (!this.connected) throw new Error('Not connected');
    const msgId = generateId();
    // 与 C2C 一致走发送队列：认证未完成时延迟发送，断线重连后自动补发
    // （后端按 (group_id, sender_id, client_msg_id) 幂等，补发不会产生重复消息）
    const msg: OutgoingMessage = {
      id: msgId,
      recipientId: groupId,
      msgType,
      content,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      kind: 'group',
      ext,
    };
    this.pendingQueue.set(msgId, msg);
    this._flush();
    return msgId;
  }

  pullGroupMessages(groupId: string, cursor: number, limit = 50, backward = false): Promise<PullHistoryResp> {
    return this._sendGroupOp<PullHistoryResp>(
      Cmd.GROUP_PULL_MSG_REQ,
      Cmd.GROUP_PULL_MSG_RESP,
      enc(im.pull.PullGroupMsgReq, { groupId, cursor, limit, isBackward: backward }),
      10000,
    );
  }

  /** 拉取全群成员已读游标（一次请求，客户端本地计算各消息已读人数） */
  getGroupReadState(groupId: string): Promise<GroupReadStateResp> {
    return this._sendGroupOp<GroupReadStateResp>(
      Cmd.GROUP_READ_STATE_REQ,
      Cmd.GROUP_READ_STATE_RESP,
      enc(im.group.GetGroupReadStateReq, { groupId }),
    );
  }

  getGroupMsgReadStatus(groupId: string, seq: number): Promise<GroupMsgReadStatusResp> {
    return this._sendGroupOp<GroupMsgReadStatusResp>(
      Cmd.GROUP_MSG_READ_REQ,
      Cmd.GROUP_MSG_READ_RESP,
      enc(im.group.GetGroupMsgReadStatusReq, { groupId, seq }),
    );
  }

  sendGroupAck(groupId: string, lastReadSeq: number): void {
    if (!this.connected) return;
    const bodyBytes = enc(im.group.GroupAckReq, { groupId, lastReadSeq });
    this._whenAuthed().then(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const buf = encode(Cmd.GROUP_ACK_REQ, 'gack-' + Date.now(), bodyBytes, this.userId);
        this.ws.send(buf);
      }
    }).catch(() => {
      // 认证等待失败（断连/超时），读回执丢失可由下次触发补报，无需处理
    });
  }

  createGroup(name: string, avatar?: string): Promise<CreateGroupResp> {
    return this._sendGroupOp<CreateGroupResp>(
      Cmd.GROUP_CREATE_REQ,
      Cmd.GROUP_CREATE_RESP,
      enc(im.group.CreateGroupReq, { name, avatar: avatar || '' }),
    );
  }

  getMyGroups(): Promise<GroupInfo[]> {
    return this._sendGroupOp<{ code: number; groups: GroupInfo[] }>(
      Cmd.GROUP_GET_MY_GROUPS_REQ,
      Cmd.GROUP_GET_MY_GROUPS_RESP,
      enc(im.group.GetMyGroupsReq, {}),
    ).then(r => r.groups || []);
  }

  inviteToGroup(groupId: string, userId: string): Promise<GroupOpResp> {
    return this._sendGroupOp<GroupOpResp>(
      Cmd.GROUP_INVITE_REQ,
      Cmd.GROUP_INVITE_RESP,
      enc(im.group.InviteToGroupReq, { groupId, userId }),
    );
  }

  /** 移除群成员（群主/管理员）；被移除者会收到 KICKED 推送并退群 */
  kickMember(groupId: string, userId: string): Promise<GroupOpResp> {
    return this._sendGroupOp<GroupOpResp>(
      Cmd.GROUP_KICK_REQ,
      Cmd.GROUP_KICK_RESP,
      enc(im.group.KickMemberReq, { groupId, userId }),
    );
  }

  getGroupInfo(groupId: string): Promise<GroupInfo> {
    return this._sendGroupOp<{ code: number; group: GroupInfo }>(
      Cmd.GROUP_GET_INFO_REQ,
      Cmd.GROUP_GET_INFO_RESP,
      enc(im.group.GetGroupInfoReq, { groupId }),
    ).then(r => r.group);
  }

  getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this._sendGroupOp<{ code: number; members: GroupMember[] }>(
      Cmd.GROUP_GET_MEMBERS_REQ,
      Cmd.GROUP_GET_MEMBERS_RESP,
      enc(im.group.GetGroupMembersReq, { groupId }),
    ).then(r => r.members || []);
  }

  // ================================================================
  // Connection & Heartbeat
  // ================================================================

  /** 认证成功：放行所有等待认证的挂起请求 */
  private _setAuthed(): void {
    if (this.authed) return;
    this.authed = true;
    const waiters = this.authWaiters;
    this.authWaiters = [];
    for (const w of waiters) {
      clearTimeout(w.timer);
      w.resolve();
    }
  }

  /** 认证已通过直接返回；否则挂起至认证成功（超时/断连拒绝） */
  private _whenAuthed(timeoutMs = 5000): Promise<void> {
    if (this.authed) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        timer: null as unknown as ReturnType<typeof setTimeout>,
      };
      waiter.timer = setTimeout(() => {
        this.authWaiters = this.authWaiters.filter((w) => w !== waiter);
        reject(new Error('等待认证超时'));
      }, timeoutMs);
      this.authWaiters.push(waiter);
    });
  }

  private _rejectAuthWaiters(reason: string): void {
    const waiters = this.authWaiters;
    this.authWaiters = [];
    for (const w of waiters) {
      clearTimeout(w.timer);
      w.reject(new Error(reason));
    }
  }

  private _authenticate(): void {
    const bodyBytes = enc(im.auth.AuthReq, {
      token: this.token,
      deviceId: 'web',
      platform: 'web',
      appVersion: '1.0.0',
    });
    const buf = encode(Cmd.AUTH_REQ, 'auth-' + Date.now(), bodyBytes, this.userId);
    this.ws!.send(buf);
  }

  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this.pongMissCount = 0;
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const buf = encode(Cmd.PING, 'ping-' + Date.now(), enc(im.heartbeat.Ping, { clientTime: Date.now() }), this.userId);
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
        await this.connect(this.userId, this.token, this.userName, this.nickname);
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
    // 网关拒绝未认证的业务命令：认证完成前保留在队列，AUTH_RESP 后 _resendPending 补发
    if (!this.authed) {
      msg.status = 'pending';
      return;
    }

    msg.status = 'sending';

    const isGroup = msg.kind === 'group';
    const messageFields: Record<string, unknown> = { msgType: msg.msgType, content: utf8(msg.content) };
    if (msg.ext && Object.keys(msg.ext).length > 0) {
      messageFields.ext = msg.ext;
    }
    const bodyBytes = isGroup
      ? enc(im.group.C2GReq, { groupId: msg.recipientId, messageId: msg.id, message: messageFields })
      : enc(im.chat.C2CReq, { senderId: this.userId, recipientId: msg.recipientId, messageId: msg.id, message: messageFields });

    // 将 userName / nickname 放入 varHeaders，供后端填充 Notify 的 senderNickname
    const buf = encode(isGroup ? Cmd.C2G_REQ : Cmd.C2C_REQ, msg.id, bodyBytes, this.userId, {
      userName: this.userName,
      nickname: this.nickname,
    });
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
      if (body?.messageId) {
        msg.serverMessageId = String(body.messageId);
      }
      // C2CResp.seq 经 longs:'String' 解码为字符串，转回数字
      const seq = body?.seq != null ? Number(body.seq) : undefined;
      this._emit('statusChange', {
        id: msg.id,
        status: 'sent',
        seq,
        serverMessageId: msg.serverMessageId,
      });
    }
  }

  private _onC2GResp(messageId: string, body: any): void {
    const msg = this.pendingQueue.get(messageId);
    if (msg) {
      if (msg.timer) {
        clearTimeout(msg.timer);
        msg.timer = undefined;
      }
      msg.status = 'sent';
      if (body?.messageId) {
        msg.serverMessageId = String(body.messageId);
      }
      const seq = body?.seq != null ? Number(body.seq) : undefined;
      this._emit('statusChange', {
        id: msg.id,
        status: 'sent',
        seq,
        serverMessageId: msg.serverMessageId,
      });
    }
  }

  private _onAckNotify(body: any): void {
    if (!body || !body.messageIds) return;
    const messageIds: (string | number)[] = body.messageIds;
    const ackType: number = body.ackType;

    for (const rawId of messageIds) {
      const id = String(rawId);

      // ACK_NOTIFY 携带的是服务端分配的 snowflake ID，
      // 而 pendingQueue 的 key 是客户端生成的 ID。
      // 因此需要同时按 key 和 serverMessageId 查找。
      let msg = this.pendingQueue.get(id);
      if (!msg) {
        // 按 serverMessageId 回查
        for (const [, m] of this.pendingQueue) {
          if (m.serverMessageId === id) {
            msg = m;
            break;
          }
        }
      }
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

  private _onMessageReceived(msg: IncomingMessage): void {
    // Fix 7：去重，避免重复消息触发多次 message 事件导致未读数重复计数
    if (this.receivedMessageIds.has(msg.id)) return;
    this.receivedMessageIds.add(msg.id);

    // 多端回推（senderId == 本机账号）：seq 属于对方信箱，推进本机收件水位会
    // 跳过自己未收的消息；对端 ACK 也只对收件人信箱有意义，二者均跳过
    const isOwnEcho = !!msg.senderId && msg.senderId === this.userId;
    if (!isOwnEcho && msg.seq > this.lastSeq) this.lastSeq = msg.seq;

    this._emit('message', msg);

    if (isOwnEcho) return;
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
    // 保持 messageIds 为字符串，避免 JavaScript Number 精度丢失（snowflake ID > 2^53）
    const bodyBytes = enc(im.ack.AckReq, { messageIds, ackType });
    this._whenAuthed()
      .then(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const buf = encode(Cmd.ACK_REQ, 'ack-' + Date.now(), bodyBytes, this.userId);
          this.ws.send(buf);
          console.log(
            `[IMClient] ACK: ${messageIds.length} msgs, type=${ackType === AckType.RECEIVED ? 'RECEIVED' : 'SEEN'}`,
          );
        }
      })
      .catch(() => {
        // 未认证即断连：ACK 丢失无妨，接收方下次拉取仍会拿到消息
      });
  }

  // ================================================================
  // Pull Offline Messages
  // ================================================================

  private _pullOfflineMessages(): void {
    if (!this.connected) return;
    // seq = 本账号同步水位（lastSeq）。后端 pullPending(recipient_id, seq > 水位) 增量拉取
    // userId 由 encode 自动写入 varHeader
    const bodyBytes = enc(im.pull.PullReq, { seq: this.lastSeq, limit: 50 });
    const buf = encode(Cmd.PULL_REQ, 'pull-' + Date.now(), bodyBytes, this.userId);
    this.ws!.send(buf);
    console.log(`[IMClient] Pull 离线消息 seq=${this.lastSeq}`);
  }

  // body 为解码后的 PullResp（messages 是 MessageContent[]）
  private _onPullResp(body: any): void {
    console.log(`[IMClient] Pull 响应: hasMore=${body?.hasMore}, code=${body?.code}`);
    const messages: any[] = body?.messages ?? body?.list ?? [];
    for (const record of messages) {
      // 先归一化为 IncomingMessage（id/senderId/recipientId/seq 取自 MessageContent.ext）
      const msg = this._messageContentToIncoming(record);
      // 即使消息被 _onMessageReceived 去重也要推进 lastSeq，避免死循环
      if (msg.seq && msg.seq > this.lastSeq) {
        this.lastSeq = msg.seq;
      }
      // 复用 _onMessageReceived 的归一化与去重逻辑派发到 UI
      this._onMessageReceived(msg);
    }
    // 继续拉取（lastSeq 已更新，不会死循环）
    if (body?.hasMore) {
      this._pullOfflineMessages();
    }
  }

  /**
   * 将 PULL_RESP body 中的消息数组归一化为 IncomingMessage[]。
   * 与 _messageContentToIncoming 的解析逻辑一致，但不触发事件、不更新 lastSeq、不去重。
   */
  private _normalizePullMessages(body: any): IncomingMessage[] {
    const rawMessages: any[] = body?.messages ?? body?.list ?? [];
    return rawMessages.map((record: any) => this._messageContentToIncoming(record));
  }

  // ================================================================
  // Proto → types.ts 归一化辅助
  // ================================================================

  /**
   * 把解码后的 MessageContent（plain）归一化为 IncomingMessage。
   * C2C 拉取（history/offline）记录把 id/senderId/recipientId/seq/senderUserName/senderNickname
   * 放进 message.ext（字符串）；C2C_NOTIFY 则由 C2CNotify 外层字段（meta）提供这些值，
   * ext 只保留显示名。
   */
  private _messageContentToIncoming(
    mc: any,
    meta?: { id?: string | number; senderId?: string | number; recipientId?: string | number; seq?: string | number; clientMsgId?: string | number },
  ): IncomingMessage {
    mc = mc || {};
    const ext: Record<string, string> = mc.ext || {};
    const createdAt = (mc.timestamp != null ? Number(mc.timestamp) : 0) || Date.now();
    return {
      id: String(meta?.id != null ? meta.id : (ext.id || '')),
      senderId: String(meta?.senderId != null ? meta.senderId : (ext.senderId || '')),
      recipientId:
        meta?.recipientId != null
          ? String(meta.recipientId)
          : ext.recipientId
            ? String(ext.recipientId)
            : undefined,
      // 服务端回带的 clientMsgId（notify 外层字段或 pull 的 ext），"0" 为缺省
      clientMsgId:
        meta?.clientMsgId != null && String(meta.clientMsgId) !== '0'
          ? String(meta.clientMsgId)
          : ext.clientMsgId && ext.clientMsgId !== '0'
            ? String(ext.clientMsgId)
            : undefined,
      senderUserName: ext.senderUserName,
      senderNickname: ext.senderNickname,
      msgType: mc.msgType != null && Number(mc.msgType) !== 0 ? (Number(mc.msgType) as MsgType) : MsgType.TEXT,
      content: mc.content ? text(mc.content) : '',
      mentions: this._mentionsOf(ext),
      seq: Number(meta?.seq != null ? meta.seq : (ext.seq || 0)) || 0,
      createdAt,
    };
  }

  /** ext.mentioned_user_ids（逗号分隔 uid）→ string[] */
  private _mentionsOf(ext: Record<string, string>): string[] | undefined {
    const raw = ext.mentioned_user_ids;
    if (!raw) return undefined;
    const ids = raw.split(',').map((x) => x.trim()).filter(Boolean);
    return ids.length > 0 ? ids : undefined;
  }

  /** C2GNotify → GroupMessage（display 名取自 message.ext，id 优先取外层 messageId） */
  private _c2gNotifyToGroupMessage(g: any, fallbackMessageId: string): GroupMessage {
    g = g || {};
    const mc = g.message || {};
    const ext: Record<string, string> = mc.ext || {};
    const rawId = g.messageId;
    const id = rawId != null && String(rawId) !== '0' ? String(rawId) : fallbackMessageId;
    return {
      id: String(id || ''),
      senderId: String(g.senderId ?? ext.senderId ?? ''),
      groupId: String(g.groupId ?? ext.groupId ?? ''),
      // 多端回推时与本地乐观气泡合并去重（"0" 为 proto3 缺省，视为无）
      clientMsgId:
        g.clientMsgId != null && String(g.clientMsgId) !== '0' ? String(g.clientMsgId) : undefined,
      name: g.name ?? ext.name,
      senderUserName: ext.senderUserName,
      senderNickname: ext.senderNickname,
      msgType: mc.msgType != null && Number(mc.msgType) !== 0 ? (Number(mc.msgType) as number) : MsgType.TEXT,
      content: mc.content ? text(mc.content) : '',
      mentions: this._mentionsOf(ext),
      seq: g.seq != null ? Number(g.seq) : 0,
      createdAt: (mc.timestamp != null ? Number(mc.timestamp) : 0) || Date.now(),
    };
  }

  /** GROUP_PULL_MSG_RESP 的记录：groupId 取自 ext.groupId，无 recipientId */
  private _groupPullMessage(mc: any): IncomingMessage {
    const m = this._messageContentToIncoming(mc);
    delete (m as Partial<IncomingMessage>).recipientId;
    const ext = mc?.ext || {};
    m.groupId = ext.groupId != null ? String(ext.groupId) : '';
    return m;
  }

  private _groupInfo(g: any): GroupInfo {
    g = g || {};
    const createdAt = g.createdAt != null ? Number(g.createdAt) : 0;
    return {
      groupId: g.groupId != null ? String(g.groupId) : '',
      name: g.name || '',
      avatar: g.avatar || '',
      description: g.description || '',
      ownerId: g.ownerId != null ? String(g.ownerId) : '',
      memberCount: g.memberCount ?? 0,
      maxMembers: g.maxMembers ?? 0,
      createdAt,
      // proto 的 GroupInfo 无 updatedAt 字段，回退为 createdAt，避免 spread 时拿到 undefined
      updatedAt: createdAt,
    };
  }

  private _groupMember(m: any): GroupMember {
    m = m || {};
    return {
      userId: String(m.userId ?? ''),
      userName: m.userName || '',
      nickname: m.nickname || '',
      avatar: m.avatar || '',
      role: m.role ?? 0,
      joinedAt: m.joinedAt != null ? Number(m.joinedAt) : 0,
    };
  }

  private _friendNotify(n: any): FriendNotify {
    n = n || {};
    return {
      userId: String(n.userId ?? ''),
      userName: n.userName || '',
      nickname: n.nickname || '',
      avatar: sameOriginMediaUrl(n.avatar || ''),
    };
  }

  /** 按 frame messageId 解析 pendingFriendOps */
  private _resolveFriendOp(messageId: string, value: any): void {
    const pending = this.pendingFriendOps.get(messageId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      this.pendingFriendOps.delete(messageId);
      pending.resolve(value);
    }
  }

  // ================================================================
  // Message Dispatch
  // ================================================================

  private _dispatchMessage(cmd: number, messageId: string, body: Uint8Array | null): void {
    // 通用错误响应（CMD_ERROR）
    if (cmd === Cmd.CMD_ERROR) {
      const err = plain(im.common.ErrorBody, body);
      const errorMessage = err?.message || '请求失败';
      const pending = this.pendingFriendOps.get(messageId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.pendingFriendOps.delete(messageId);
        pending.reject(new Error(errorMessage));
      } else {
        this._emit('error', new Error(`[${err?.code ?? 'UNKNOWN'}] ${errorMessage}`));
      }
      return;
    }

    switch (cmd) {
      case Cmd.AUTH_RESP: {
        const resp = plain(im.auth.AuthResp, body);
        if (resp?.code !== 0) {
          const reason = resp?.message || '认证失败，请重新登录';
          this._emit('authExpired', reason);
          // 认证失败后断开连接，停止后续重连（token 已失效，重连无意义）
          this.intentionallyDisconnected = true;
          this.ws?.close();
          return;
        }
        console.log('[IMClient] 认证成功');
        // 认证通过：放行挂起的业务请求，拉取离线消息并补发队列
        this._setAuthed();
        this._pullOfflineMessages();
        this._resendPending();
        break;
      }

      case Cmd.C2C_RESP: {
        const resp = plain(im.chat.C2CResp, body);
        if (resp?.code !== 0) {
          this._emit('error', new Error(resp?.message || '发送失败'));
          return;
        }
        this._onC2CResp(messageId, resp);
        break;
      }

      case Cmd.C2C_NOTIFY: {
        const n = plain(im.chat.C2CNotify, body);
        const rawId = n?.messageId;
        const msg = this._messageContentToIncoming(n?.message, {
          id: rawId != null && String(rawId) !== '0' ? String(rawId) : messageId,
          senderId: n?.senderId,
          recipientId: n?.recipientId,
          seq: n?.seq,
          clientMsgId: n?.clientMsgId,
        });
        this._onMessageReceived(msg);
        break;
      }

      case Cmd.PONG:
        if (this.pongTimer) {
          clearTimeout(this.pongTimer);
          this.pongTimer = null;
        }
        this.pongMissCount = 0;
        break;

      case Cmd.ACK_NOTIFY:
        this._onAckNotify(plain(im.ack.AckNotify, body));
        break;

      case Cmd.PULL_RESP: {
        const pull = plain(im.pull.PullResp, body);
        // 优先检查是否为 pending history pull（Promise 模式）
        const pendingPull = this.pendingHistoryPulls.get(messageId);
        if (pendingPull) {
          clearTimeout(pendingPull.timeoutId);
          this.pendingHistoryPulls.delete(messageId);
          const resp: PullHistoryResp = {
            code: pull?.code ?? 0,
            message: pull?.message ?? '',
            messages: this._normalizePullMessages(pull),
            hasMore: pull?.hasMore ?? false,
          };
          pendingPull.resolve(resp);
          return;
        }
        // 否则处理为离线消息拉取（事件模式）
        this._onPullResp(pull ?? {});
        break;
      }

      case Cmd.CTRL_NOTIFY: {
        const ctrl = plain(im.ctrl.CtrlNotify, body);
        const ctrlType = Number(ctrl?.ctrlType ?? 0);
        if (ctrlType === im.ctrl.CtrlType.CTRL_TYPE_KICK_OFFLINE
          || ctrlType === im.ctrl.CtrlType.CTRL_TYPE_FORCE_LOGOUT) {
          // 顶号下线：先置主动断开标志停止重连，再交上层登出回登录页；
          // 服务端随后会关闭连接，onclose 看到 intentionallyDisconnected 不会重连
          this.disconnect();
          this._emit('kicked', ctrl?.reason || '账号在其他设备登录，本会话已下线');
        } else if (ctrlType === im.ctrl.CtrlType.CTRL_TYPE_SYNC) {
          // 多端同步信号：从本机收件水位增量拉取（幂等，重复触发由去重兜底）
          this._pullOfflineMessages();
        }
        // CTRL_TYPE_NOTIFY 等其余类型暂不处理
        break;
      }

      case Cmd.ACK_RESP:
        // ACK 已确认，无需处理
        break;

      case Cmd.CMD_UPLOAD_RESP: {
        const pending = this.pendingUploads.get(messageId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          this.pendingUploads.delete(messageId);
          const u = plain(im.upload.UploadResp, body);
          if (u?.code === 0) {
            pending.resolve({
              code: u.code,
              message: u.message || '',
              objectKey: u.objectKey || '',
              presignedUrl: u.presignedUrl || '',
              // expireAt int64 → 字符串，转回数字
              expireAt: (u.expireAt != null ? Number(u.expireAt) : 0) || 0,
            });
          } else {
            pending.reject(new Error(u?.message || '上传预签名失败'));
          }
        }
        break;
      }

      // 群转让/解散/改名响应
      case Cmd.CMD_GROUP_TRANSFER_RESP:
      case Cmd.CMD_GROUP_DISSOLVE_RESP:
      case Cmd.CMD_GROUP_UPDATE_RESP: {
        const raw = plain(im.group.TransferGroupResp, body);
        const resp: GroupOpResp = { code: raw?.code ?? 0, message: raw?.message ?? '' };
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

      // 资料更新响应
      case Cmd.CMD_PROFILE_UPDATE_RESP: {
        const raw = plain(im.profile.ProfileUpdateResp, body);
        const resp: UpdateProfileResp = {
          code: raw?.code ?? 0,
          message: raw?.message ?? '',
          avatar: raw?.avatar || '',
          signature: raw?.signature || '',
        };
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

      // 好友操作响应
      case Cmd.FRIEND_SEARCH_RESP: {
        const u = plain(im.relation.SearchUserResp, body);
        const resp: SearchUserResp = {
          code: u?.code ?? 0,
          message: u?.message ?? '',
          users: (u?.users || []).map((x: any) => ({
            userId: String(x.userId ?? ''),
            userName: x.userName || '',
            nickname: x.nickname || '',
            avatar: sameOriginMediaUrl(x.avatar || ''),
          })),
        };
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
        const cls =
          cmd === Cmd.FRIEND_ADD_RESP
            ? im.relation.FriendAddResp
            : cmd === Cmd.FRIEND_ACCEPT_RESP
              ? im.relation.FriendAcceptResp
              : im.relation.FriendDeleteResp;
        const raw = plain(cls, body);
        const resp: FriendOpResp = { code: raw?.code ?? 0, message: raw?.message ?? '' };
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
        this._emit('friendRequest', this._friendNotify(plain(im.relation.FriendAddNotify, body)));
        break;
      }
      case Cmd.FRIEND_ACCEPT_NOTIFY: {
        this._emit('friendAccepted', this._friendNotify(plain(im.relation.FriendAcceptNotify, body)));
        break;
      }
      case Cmd.FRIEND_DELETE_NOTIFY: {
        const n = plain(im.relation.FriendDeleteNotify, body);
        const notify: FriendDeleteNotify = { userId: n?.userId != null ? String(n.userId) : '' };
        this._emit('friendDeleted', notify);
        break;
      }

      case Cmd.CALL_INVITE_RESP:
      case Cmd.CALL_ACCEPT_RESP:
      case Cmd.CALL_END_RESP:
      case Cmd.CALL_TOKEN_RESP: {
        const cls =
          cmd === Cmd.CALL_INVITE_RESP
            ? im.call.CallInviteResp
            : cmd === Cmd.CALL_ACCEPT_RESP
              ? im.call.CallAcceptResp
              : cmd === Cmd.CALL_END_RESP
                ? im.call.CallEndResp
                : im.call.CallTokenResp;
        const raw = plain(cls, body);
        const pending = this.pendingFriendOps.get(messageId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          this.pendingFriendOps.delete(messageId);
          if (raw?.code === 0) {
            pending.resolve(raw);
          } else {
            pending.reject(new Error(raw?.message || '通话操作失败'));
          }
        }
        break;
      }

      case Cmd.CALL_EVENT_PUSH: {
        const p = plain(im.call.CallEventPush, body);
        const event: CallEvent = {
          callId: p?.callId ?? '',
          event: (p?.event ?? 0) as CallEvent['event'],
          mediaType: p?.mediaType ?? 0,
          peerId: p?.peerId != null ? String(p.peerId) : '',
          peerUserName: p?.peerUserName || '',
          peerNickname: p?.peerNickname || '',
          reason: p?.reason ?? 0,
          room: p?.room ?? '',
          token: p?.token ?? '',
          wsUrl: p?.wsUrl ?? '',
          participantCount: p?.participantCount ?? 0,
        };
        this._emit('callEvent', event);
        break;
      }

      case Cmd.C2G_RESP: {
        const resp = plain(im.group.C2GResp, body);
        if (resp?.code !== 0) {
          this._emit('error', new Error(resp?.message || '群消息发送失败'));
          return;
        }
        this._onC2GResp(messageId, resp);
        break;
      }

      case Cmd.C2G_NOTIFY: {
        const g = plain(im.group.C2GNotify, body);
        const msg = this._c2gNotifyToGroupMessage(g, messageId);
        this._emit('groupMessage', msg);
        break;
      }

      case Cmd.GROUP_MEMBER_CHANGE_NOTIFY: {
        const n = plain(im.group.GroupMemberChangeNotify, body);
        // proto 枚举数字 → 枚举名字符串（hook 按 'LEFT'/'KICKED' 字符串判断）
        const typeName =
          typeof n?.type === 'number' && n.type >= 0 && n.type < GROUP_MEMBER_CHANGE_NAMES.length
            ? GROUP_MEMBER_CHANGE_NAMES[n.type]
            : n?.type != null
              ? String(n.type)
              : '';
        const notify: GroupMemberChangeNotify = {
          groupId: n?.groupId != null ? String(n.groupId) : '',
          type: typeName,
          userId: n?.userId != null ? String(n.userId) : '',
          operatorId: n?.operatorId != null ? String(n.operatorId) : undefined,
          userName: n?.userName,
          nickname: n?.nickname,
          name: n?.name || undefined,
          description: n?.description !== undefined ? (n.description as string) : undefined,
        };
        this._emit('groupMemberChange', notify);
        break;
      }

      case Cmd.GROUP_CREATE_RESP: {
        const r = plain(im.group.CreateGroupResp, body);
        this._resolveFriendOp(messageId, {
          code: r?.code ?? 0,
          message: r?.message ?? '',
          group: this._groupInfo(r?.group),
        });
        break;
      }
      case Cmd.GROUP_INVITE_RESP: {
        const r = plain(im.group.InviteToGroupResp, body);
        this._resolveFriendOp(messageId, { code: r?.code ?? 0, message: r?.message ?? '' });
        break;
      }
      case Cmd.GROUP_KICK_RESP: {
        const r = plain(im.group.KickMemberResp, body);
        this._resolveFriendOp(messageId, { code: r?.code ?? 0, message: r?.message ?? '' });
        break;
      }
      case Cmd.GROUP_GET_INFO_RESP: {
        const r = plain(im.group.GetGroupInfoResp, body);
        this._resolveFriendOp(messageId, {
          code: r?.code ?? 0,
          message: r?.message ?? '',
          group: this._groupInfo(r?.group),
        });
        break;
      }
      case Cmd.GROUP_GET_MEMBERS_RESP: {
        const r = plain(im.group.GetGroupMembersResp, body);
        this._resolveFriendOp(messageId, {
          code: r?.code ?? 0,
          message: r?.message ?? '',
          members: (r?.members || []).map((m: any) => this._groupMember(m)),
        });
        break;
      }
      case Cmd.GROUP_GET_MY_GROUPS_RESP: {
        const r = plain(im.group.GetMyGroupsResp, body);
        this._resolveFriendOp(messageId, {
          code: r?.code ?? 0,
          message: r?.message ?? '',
          groups: (r?.groups || []).map((g: any) => this._groupInfo(g)),
        });
        break;
      }
      case Cmd.GROUP_PULL_MSG_RESP: {
        const r = plain(im.pull.PullResp, body);
        this._resolveFriendOp(messageId, {
          code: r?.code ?? 0,
          message: r?.message ?? '',
          messages: (r?.messages || []).map((m: any) => this._groupPullMessage(m)),
          hasMore: r?.hasMore ?? false,
        });
        break;
      }
      case Cmd.GROUP_ACK_RESP: {
        const r = plain(im.group.GroupAckResp, body);
        this._resolveFriendOp(messageId, { code: r?.code ?? 0, message: r?.message ?? '' });
        break;
      }
      case Cmd.GROUP_READ_STATE_RESP: {
        const r = plain(im.group.GetGroupReadStateResp, body);
        this._resolveFriendOp(messageId, {
          code: r?.code ?? 0,
          message: r?.message ?? '',
          members: (r?.members || []).map((m: any) => ({
            userId: String(m.userId ?? ''),
            lastReadSeq: Number(m.lastReadSeq ?? 0),
          })),
        });
        break;
      }
      case Cmd.GROUP_MSG_READ_RESP: {
        const r = plain(im.group.GetGroupMsgReadStatusResp, body);
        this._resolveFriendOp(messageId, {
          code: r?.code ?? 0,
          message: r?.message ?? '',
          readers: (r?.readers || []).map((x: any) => ({
            userId: String(x.userId ?? ''),
            nickname: x.nickname || '',
            avatar: x.avatar || '',
          })),
        });
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
