# 仿微信 Web 聊天页面 — 技术设计文档

## 1. 概述

从零构建一个仿微信风格的 Web 端聊天页面，对接已有的 pomelo 后端 IM 服务（WebSocket 网关端口 9001 + HTTP API 端口 8888）。聚焦 C2C 单聊功能，支持富媒体消息、消息状态追踪、离线消息拉取等完整聊天体验。

## 2. 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS（自定义微信主题色） |
| 路由 | React Router v6 |
| 通信 | WebSocket（自定义二进制线协议，JSON 编码） |

## 3. 功能清单

### 核心功能

| 模块 | 功能点 |
|------|--------|
| 登录/注册 | 登录页面、用户注册，userId/密码登录，对接 HTTP API（端口 8080） |
| 会话列表 | 左侧会话列表，头像、昵称、最后一条消息预览、未读消息数红点 |
| 聊天窗口 | 右侧聊天区域，仿微信气泡消息样式，消息状态（发送中/已发送/已送达/已读） |
| 富媒体消息 | 支持发送图片、表情、文件等富媒体消息类型 |

### 附加功能

| 模块 | 功能点 |
|------|--------|
| 未读消息计数 | 会话列表红点标记、当前聊天未读消息数统计 |
| 连接状态管理 | 断线自动重连、心跳保活（30s Ping/Pong）、网络状态指示条 |
| 离线消息加载 | 上线后拉取离线期间的历史消息并展示 |
| 搜索功能 | 搜索好友、搜索聊天记录 |

## 4. 项目架构

```
pomelo-web/
├── src/
│   ├── sdk/                  # IM SDK 封装层
│   │   ├── protocol.ts       # 二进制线协议编解码（移植 im-sdk.js）
│   │   ├── client.ts         # WebSocket 客户端（连接/重连/心跳）
│   │   └── types.ts          # 协议类型定义（Cmd、消息结构等）
│   ├── stores/               # Zustand 状态管理
│   │   ├── useAuthStore.ts   # 认证状态（登录/登出/用户信息）
│   │   ├── useChatStore.ts   # 聊天状态（消息列表/发送队列/消息状态）
│   │   └── useConversationStore.ts  # 会话列表状态
│   ├── pages/                # 页面组件
│   │   ├── Login/            # 登录/注册页
│   │   └── Chat/             # 主聊天页（会话列表 + 聊天窗口）
│   ├── components/           # 通用 UI 组件
│   │   ├── MessageBubble/    # 消息气泡
│   │   ├── ConversationItem/ # 会话列表项
│   │   ├── MessageInput/     # 消息输入框（文本/图片/表情/文件）
│   │   ├── SearchBar/        # 搜索栏
│   │   └── ConnectionBanner/ # 连接状态提示条
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useIMClient.ts    # SDK 连接生命周期管理
│   │   └── useUnreadCount.ts # 未读消息计数
│   ├── utils/                # 工具函数
│   ├── assets/               # 静态资源
│   ├── App.tsx               # 根组件 + 路由
│   └── main.tsx              # 入口
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 分层原则

- **SDK 层**（`sdk/`）：TypeScript 重写后端 im-sdk.js，封装线协议编解码、WebSocket 连接管理、心跳、重连、消息队列
- **Store 层**（`stores/`）：Zustand store 订阅 SDK 事件，将消息流转化为响应式 UI 状态
- **UI 层**（`pages/` + `components/`）：纯展示组件，从 store 读取数据，通过 action 触发 SDK 操作

## 5. SDK 层设计

### 5.1 线协议（protocol.ts）

基于后端自定义二进制线协议（大端序），完整移植 im-sdk.js：

```
+----------+-------+---------+---------+------+-----------+--------+--------+------+
| totalLen | magic | version | codecId | cmd  | msgIdLen  | msgId  | hdrCnt | hdrs | bodyLen | body |
| 4 bytes  | 4B    | 1B      | 1B      | 4B   | 4B        | var    | 4B     | var  | 4B      | var  |
+----------+-------+---------+---------+------+-----------+--------+--------+------+
```

- magic = `0x504D454C` ("PMEL")
- version = 1
- codecId = 1（JSON 编码）
- WebSocket 发送时省略前 4 字节 totalLen
- userId 通过 varHeaders 传递

### 5.2 WebSocket 客户端（client.ts）

| 功能 | 实现细节 |
|------|---------|
| 连接管理 | `connect(userId, token)` / `disconnect()`，Promise 化 |
| 心跳保活 | 30s 间隔发送 PING（0x0050），连续 3 次 Pong 超时触发断线 |
| 断线重连 | 指数退避（1s→2s→4s→8s...），最多 10 次，重连后自动拉取离线消息 |
| 消息发送 | 发送队列 + 指数退避重试（5s→10s→20s，最多 3 次），超时标记 failed |
| 消息接收 | 统一事件分发：onMessage / onStatusChange / onKicked |
| ACK 聚合 | 200ms 窗口批量聚合 RECEIVED ACK，`markSeen()` 发送 SEEN ACK |
| 离线消息 | `pullOfflineMessages(lastMsgId, limit)` 循环拉取直到 hasMore=false |

### 5.3 事件模型

```typescript
interface IMClientEvents {
  'message': (msg: IncomingMessage) => void;
  'status-change': (update: StatusUpdate) => void;
  'kicked': (reason: string) => void;
  'connection-change': (state: ConnectionState) => void;
}
```

### 5.4 连接状态机

```
disconnected → connecting → connected → reconnecting → connected
                                    ↘ disconnected（重连耗尽）
```

### 5.5 类型定义（types.ts）

- Cmd 命令字枚举：AUTH_REQ=0x0001, AUTH_RESP=0x0002, C2C_REQ=0x0010, C2C_RESP=0x0011, C2C_NOTIFY=0x0012, PULL_REQ=0x0030, PULL_RESP=0x0031, PING=0x0050, PONG=0x0051, ACK_REQ=0x0052, ACK_RESP=0x0053, ACK_NOTIFY=0x0054
- 消息状态：`pending | sending | sent | delivered | seen | failed`
- 消息类型：`text=1, image=2, file=3, emoji=4`
- ACK 类型：RECEIVED=0, SEEN=1

### 5.6 三层消息确认模型

```
A --C2CReq--> Server --C2CNotify--> B
  <--C2CResp--           <--AckReq(RECEIVED)--
  <----------AckNotify(RECEIVED)-----------
                         <--AckReq(SEEN)--
  <----------AckNotify(SEEN)--------------
```

| 阶段 | 发送方 UI | 含义 |
|------|-----------|------|
| C2CResp 返回 | 单勾 ✓ "已发送" | 服务端已存储 |
| AckNotify(RECEIVED) | 双勾 ✓✓ "已送达" | 接收方设备已收到 |
| AckNotify(SEEN) | 蓝色双勾 ✓✓ "已读" | 接收方已阅读 |

## 6. 状态管理设计

### 6.1 useAuthStore — 认证状态

```typescript
interface AuthState {
  user: { userId: string; nickname: string; avatar: string } | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (userId: string, password: string) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => void;
}
```

- 登录流程：HTTP 注册/登录 → 获取 token → 建立 WebSocket 连接 → AUTH_REQ 认证
- Token 持久化到 localStorage，刷新页面自动恢复会话

### 6.2 useConversationStore — 会话列表

```typescript
interface Conversation {
  peerId: string;
  nickname: string;
  avatar: string;
  lastMessage: string;      // 截断50字
  lastMessageTime: number;
  unreadCount: number;
  draft?: string;
}

interface ConversationState {
  conversations: Map<string, Conversation>;
  sortedList: string[];     // 按最后消息时间倒序
  activePeerId: string | null;
  setActivePeer: (peerId: string) => void;
  clearUnread: (peerId: string) => void;
  updateDraft: (peerId: string, text: string) => void;
}
```

### 6.3 useChatStore — 聊天消息

```typescript
interface ChatMessage {
  msgId: string;
  senderId: string;
  recipientId: string;
  msgType: MsgType;         // text | image | file | emoji
  content: string;
  status: MessageStatus;    // pending | sending | sent | delivered | seen | failed
  timestamp: number;
  seq?: number;
}

interface ChatState {
  messages: Map<string, ChatMessage[]>;
  sendText: (peerId: string, text: string) => void;
  sendImage: (peerId: string, file: File) => void;
  sendFile: (peerId: string, file: File) => void;
  onIncomingMessage: (msg: IncomingMessage) => void;
  onStatusChange: (update: StatusUpdate) => void;
  loadOfflineMessages: () => Promise<void>;
  searchMessages: (keyword: string, peerId?: string) => ChatMessage[];
}
```

### 6.4 Store 间协作

```
SDK 事件 → useChatStore.onIncomingMessage()
         → useConversationStore 更新会话预览和未读数
         → 非当前会话时 unreadCount +1

用户发送 → useChatStore.sendText()
         → SDK.sendMessage()
         → 状态 pending → sending → sent → delivered → seen
```

## 7. UI 组件设计

### 7.1 整体布局

仿微信经典布局：左侧会话列表（280px 固定宽度）+ 右侧聊天区域（弹性宽度）。

```
┌─────────────────────────────────────────────────────┐
│  连接状态提示条 (ConnectionBanner)                      │
├──────────┬──────────────────────────────────────────┤
│          │  聊天对象昵称                  更多操作     │
│  搜索栏   ├──────────────────────────────────────────┤
│          │                                          │
│  会话列表 │           消息列表区域                      │
│          │    （气泡消息 + 时间分割线）                  │
│          │                                          │
│          │  ┌──────────────────────────────────┐    │
│          │  │ 😊 输入消息...     📎 🎤  发送   │    │
│          │  └──────────────────────────────────┘    │
├──────────┴──────────────────────────────────────────┤
│  底部：用户头像 + 设置                                  │
└─────────────────────────────────────────────────────┘
```

### 7.2 页面

| 页面 | 路由 | 说明 |
|------|------|------|
| LoginPage | `/login` | 登录/注册双 Tab 切换，居中卡片式布局 |
| ChatPage | `/chat` | 主聊天页，需登录态 |

### 7.3 核心组件

| 组件 | 职责 |
|------|------|
| ConnectionBanner | 顶部状态条：连接中(黄)/已断开(红)/已连接(隐藏) |
| SearchBar | 会话列表顶部搜索，支持搜索好友和聊天记录 |
| ConversationItem | 头像 + 昵称 + 最后消息 + 时间 + 未读红点，active 态绿色高亮 |
| MessageBubble | 己方右对齐绿色气泡、对方左对齐白色气泡；状态图标（✓/✓✓/蓝色✓✓） |
| MessageInput | 多行文本框 + 工具栏（图片/表情/文件）+ 发送按钮，Enter 发送，Shift+Enter 换行 |
| MessageList | 消息列表容器，虚拟滚动，自动滚底，时间分割线 |
| EmojiPicker | 表情选择面板 |

### 7.4 微信主题色（Tailwind 扩展）

| Token | 值 | 用途 |
|-------|-----|------|
| wechat-green | #07C160 | 主色：按钮、己方气泡、active 态 |
| wechat-green-dark | #06AD56 | hover/pressed 态 |
| wechat-bg | #EBEBEB | 聊天区域背景 |
| wechat-sidebar | #E3E3E3 | 会话列表背景 |
| wechat-bubble-self | #95EC69 | 己方气泡绿 |
| wechat-bubble-other | #FFFFFF | 对方气泡白 |
| wechat-text | #1D1D1D | 主文字色 |
| wechat-text-secondary | #B2B2B2 | 辅助文字 |

### 7.5 响应式

- 最小宽度 800px，左侧固定 280px，右侧弹性
- Web 端优先，暂不做移动端适配

## 8. 后端服务对接

| 服务 | 地址 | 协议 | 用途 |
|------|------|------|------|
| WebSocket 网关 | ws://localhost:9001 | 二进制线协议 (JSON) | 实时消息 |
| HTTP API | http://localhost:8888 | REST JSON | 注册/登录/用户查询/好友列表 |

### 8.1 HTTP API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/user/register` | POST | 用户注册 (userId, nickname, password, avatar) |
| `/api/user/:userId/profile` | GET | 查询用户信息 |
| `/api/friends/:userId` | GET | 好友列表 |

### 8.2 参考资源

| 资源 | 路径（后端项目 pomelo） | 用途 |
|------|------|------|
| im-sdk.js | src/test/resources/im-sdk.js | JS 线协议编解码参考 |
| c2c-test.html | src/test/resources/c2c-test.html | 简易聊天 UI 参考 |
| Proto 定义 | src/main/proto/ | Protobuf 消息定义 |
| 消息可靠性设计 | docs/2026-07-17-message-reliability-design.md | SDK 设计规格 |
| 数据库 Schema | db/schema.sql | 数据模型参考 |
