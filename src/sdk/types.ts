// 协议常量
export const MAGIC = 0x504D454C; // "PMEL"
export const VERSION = 1;
/** 线协议 codecId：统一为 0（Protobuf）。JSON codec（1）已弃用。 */
export const CODEC_PROTOBUF = 0;

// Cmd 命令字枚举（对齐 im-sdk.js L67-74）
export enum Cmd {
  AUTH_REQ = 0x0001,
  AUTH_RESP = 0x0002,
  LOGOUT_REQ = 0x0003,
  LOGOUT_RESP = 0x0004,
  C2C_REQ = 0x0010,
  C2C_RESP = 0x0011,
  C2C_NOTIFY = 0x0012,
  C2G_REQ = 0x0020,
  C2G_RESP = 0x0021,
  C2G_NOTIFY = 0x0022,
  PULL_REQ = 0x0030,
  PULL_RESP = 0x0031,
  CTRL_REQ = 0x0040,
  CTRL_RESP = 0x0041,
  CTRL_NOTIFY = 0x0042,
  PING = 0x0050,
  PONG = 0x0051,
  ACK_REQ = 0x0052,
  ACK_RESP = 0x0053,
  ACK_NOTIFY = 0x0054,

  // 好友相关命令字 0x0060-0x006A
  FRIEND_SEARCH_REQ = 0x0060,
  FRIEND_SEARCH_RESP = 0x0061,
  FRIEND_ADD_REQ = 0x0062,
  FRIEND_ADD_RESP = 0x0063,
  FRIEND_ADD_NOTIFY = 0x0064,
  FRIEND_ACCEPT_REQ = 0x0065,
  FRIEND_ACCEPT_RESP = 0x0066,
  FRIEND_ACCEPT_NOTIFY = 0x0067,
  FRIEND_DELETE_REQ = 0x0068,
  FRIEND_DELETE_RESP = 0x0069,
  FRIEND_DELETE_NOTIFY = 0x006A,

  // 群管理操作 0x0070-0x0097
  GROUP_CREATE_REQ = 0x0070,
  GROUP_CREATE_RESP = 0x0071,
  GROUP_INVITE_REQ = 0x0072,
  GROUP_INVITE_RESP = 0x0073,
  GROUP_GET_INFO_REQ = 0x0086,
  GROUP_GET_INFO_RESP = 0x0087,
  GROUP_GET_MEMBERS_REQ = 0x0088,
  GROUP_GET_MEMBERS_RESP = 0x0089,
  GROUP_GET_MY_GROUPS_REQ = 0x0090,
  GROUP_GET_MY_GROUPS_RESP = 0x0091,
  GROUP_MEMBER_CHANGE_NOTIFY = 0x0093,
  GROUP_PULL_MSG_REQ = 0x0094,
  GROUP_PULL_MSG_RESP = 0x0095,
  GROUP_ACK_REQ = 0x0096,
  GROUP_ACK_RESP = 0x0097,
  GROUP_MSG_READ_REQ = 0x0098,
  GROUP_MSG_READ_RESP = 0x0099,
  GROUP_READ_STATE_REQ = 0x009A,
  GROUP_READ_STATE_RESP = 0x009B,

  // 媒体上传 0x00A0-0x00A1
  CMD_UPLOAD_REQ = 0x00A0,
  CMD_UPLOAD_RESP = 0x00A1,

  // 通用错误响应
  CMD_ERROR = 0xFFFF,
}

// 消息类型（对齐后端 common.proto MsgType）
export enum MsgType {
  TEXT = 1,
  IMAGE = 2,
  VOICE = 3,
  VIDEO = 4,
  FILE = 5,
  EMOJI = 6,
  FORWARD = 8,
  REPLY = 9,
}

// ACK 类型
export enum AckType {
  RECEIVED = 0,
  SEEN = 1,
}

// 引用消息快照（客户端生成，服务端直存直透）
export interface ReplySnippet {
  messageId: string;
  senderId: string;
  msgType: number;
  senderName?: string;
  snippet: string;
  thumb?: string;
  thumbUrl?: string;
}

// 消息状态
export type MessageStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';

// 连接状态
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// 发送队列项
export interface OutgoingMessage {
  id: string;
  recipientId: string;
  msgType: MsgType;
  content: string;
  status: MessageStatus;
  createdAt: number;
  retryCount: number;
  timer?: ReturnType<typeof setTimeout>;
  serverMessageId?: string;
  /** 消息种类：c2c 走 C2CReq 补发，group 走 C2GReq 补发（重连/认证后重发时区分编码路径） */
  kind?: 'c2c' | 'group';
}

// 接收消息（归一化）。C2C 消息用 recipientId，群消息用 groupId
export interface IncomingMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  senderUserName?: string;
  senderNickname?: string;
  msgType: MsgType;
  content: string;
  seq: number;
  createdAt: number;
}

// 消息状态变化
export interface StatusUpdate {
  id: string;
  status: MessageStatus;
  seq?: number;
  serverMessageId?: string;
}

// 事件映射
export interface IMClientEvents {
  message: (msg: IncomingMessage) => void;
  statusChange: (update: StatusUpdate) => void;
  connectionChange: (state: ConnectionState) => void;
  kicked: (reason: string) => void;
  authExpired: (reason: string) => void;
  error: (err: Error) => void;
  // 好友相关事件
  searchResult: (resp: SearchUserResp) => void;
  friendRequest: (notify: FriendNotify) => void;
  friendAccepted: (notify: FriendNotify) => void;
  friendDeleted: (notify: FriendDeleteNotify) => void;
  // 群聊相关事件
  groupMessage: (msg: GroupMessage) => void;
  groupMemberChange: (notify: GroupMemberChangeNotify) => void;
}

// 好友相关类型
export interface SearchUserResp {
  code: number;
  message: string;
  users: Array<{
    userId: string;
    userName: string;
    nickname: string;
    avatar: string;
  }>;
}

export interface FriendOpResp {
  code: number;
  message: string;
}

export interface FriendNotify {
  userId: string;
  userName: string;
  nickname: string;
  avatar: string;
}

export interface FriendDeleteNotify {
  userId: string;
}

// 会话类型
export type ConversationType = 'c2c' | 'group';

// 群聊相关类型
export interface GroupInfo {
  groupId: string;
  name: string;
  avatar: string;
  description: string;
  ownerId: string;
  memberCount: number;
  maxMembers: number;
  createdAt: number;
  updatedAt: number;
}

export interface GroupMember {
  userId: string;
  userName: string;
  nickname: string;
  avatar: string;
  role: number;
  joinedAt: number;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  groupId: string;
  name?: string;
  senderUserName?: string;
  senderNickname?: string;
  msgType: number;
  content: string;
  seq: number;
  createdAt: number;
}

export interface GroupMemberChangeNotify {
  groupId: string;
  type: string;
  userId: string;
  operatorId?: string;
  userName?: string;
  nickname?: string;
}

export interface GroupOpResp {
  code: number;
  message: string;
}

export interface GroupMsgReader {
  userId: string;
  nickname: string;
  avatar: string;
}

export interface GroupMsgReadStatusResp {
  code: number;
  message: string;
  readers: GroupMsgReader[];
}

/** 群成员已读游标（一次拉取覆盖全群） */
export interface MemberReadState {
  userId: string;
  lastReadSeq: number;
}

export interface GroupReadStateResp {
  code: number;
  message: string;
  members: MemberReadState[];
}

export interface CreateGroupResp {
  code: number;
  message: string;
  group: GroupInfo;
}

// 通用错误响应体
export interface ErrorBody {
  code: number;
  message: string;
}

// 拉取历史消息响应
export interface PullHistoryResp {
  code: number;
  message: string;
  messages: IncomingMessage[];
  hasMore: boolean;
}

// 媒体上传请求（CMD_UPLOAD_REQ body）
export interface UploadReq {
  mediaType: number; // MsgType: 2=image 3=voice 4=video 5=file 6=emoji
  fileName: string;
  size: number;
  contentType?: string;
}

// 媒体上传响应（CMD_UPLOAD_RESP body）
export interface UploadResp {
  code: number;
  message: string;
  objectKey: string;
  presignedUrl: string; // presigned PUT URL
  expireAt: number;
}

// 媒体消息 content 的字符串化 JSON 结构。
// 落库只存 key + 元数据；url/thumbUrl 由服务端读侧注入（presigned GET）。
export interface MediaContent {
  key: string;
  thumb?: string;
  width?: number;
  height?: number;
  duration?: number; // 语音/视频时长 ms
  size?: number;
  fileName?: string;
  format?: string;
  url?: string; // 服务端注入的 presigned GET URL
  thumbUrl?: string; // 服务端注入的缩略图 URL
}
