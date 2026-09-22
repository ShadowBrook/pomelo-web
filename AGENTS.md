# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (HMR on localhost)
npm run build        # TypeScript compile + Vite production build
npm run preview      # Preview production build locally
npm test             # Run all Vitest tests (vitest run)
npm run lint         # ESLint across the project
```

Tests use Vitest. Write tests alongside source files (e.g., `src/sdk/protocol.test.ts`).

## Architecture

Pomelo Web is a React SPA instant-messaging client with a WeChat-style UI. It communicates with a Java backend over a custom binary WebSocket protocol and REST APIs.

### Tech Stack
- **React 19** + **TypeScript 7** (strict mode)
- **Vite 8** (build/bundler) with `@` → `src/` path alias
- **Tailwind CSS 4** with WeChat-themed `@theme` tokens in `src/index.css`
- **Zustand 5** for state management
- **React Router 6** with lazy-loaded pages
- **Vitest 4** for testing

### WebSocket Protocol (`src/sdk/`)

The `IMClient` class (`src/sdk/client.ts`) is the core networking layer. It uses a custom binary protocol defined in `src/sdk/protocol.ts`:

- **Wire format** (big-endian): `totalLen(4) | magic(4) | version(1) | codecId(1) | cmd(4) | msgIdLen(4) | msgId(var) | hdrCnt(4) | [keyLen+key+valLen+val]... | bodyLen(4) | body(var)`
- Magic number: `0x504D454C` ("PMEL"), JSON codec
- `totalLen = buffer.byteLength - 4` (matches backend `ImMessage.java`)
- Command types (enum `Cmd` in `src/sdk/types.ts`): `AUTH_REQ/RESP`, `C2C_REQ/RESP/NOTIFY`, `PING/PONG`, `ACK_REQ/RESP/NOTIFY`, `PULL_REQ/RESP`, `CTRL_NOTIFY` (kick), and friend operations (`FRIEND_SEARCH/ADD/ACCEPT/DELETE` with `_REQ/_RESP/_NOTIFY` variants)
- `IMClient` features: exponential backoff reconnection, heartbeat with PONG timeout detection (3 misses → reconnect), send queue with retry (up to 3 retries, exponential backoff 5s→10s→20s), ACK batching (200ms aggregation window), offline message pulling via `PULL_REQ/RESP` with `lastSeq` cursor, message-level dedup via `receivedMessageIds` Set
- Friend operations (`searchUsers`, `addFriend`, `acceptFriend`, `deleteFriend`) use a `_sendFriendOp` pattern: send REQ, wait for RESP matched by `messageId`, 5s timeout — no ACK mechanism for friend ops

### State Management (`src/stores/`)

Four Zustand stores, all vanilla (no React Context needed). Event callbacks use `store.getState()` rather than hooks to avoid stale closures.

| Store | Key State | Notes |
|---|---|---|
| `useAuthStore` | `user`, `token`, `isLoggedIn` | Persisted to `localStorage` via Zustand `persist` middleware. Login and register both use the backend `/api/user/register` endpoint (409 = already exists → treated as login) |
| `useChatStore` | `messages: Record<peerId, ChatMessage[]>` | Messages bucketed by peer ID, sorted by `timestamp` (createdAt). `senderId: '__self__'` for outgoing messages. `hydrateFromDb()` restores the last page per conversation from IndexedDB at login; `loadMoreHistory(peerId)` pages locally first (IndexedDB) and only falls back to the server after the local store runs out. `retryMessage()` creates a new message ID for retries |
| `useConversationStore` | `conversations: Record<peerId, Conversation>`, `activePeerId` | Tracks unread counts (increments for incoming messages unless that peer is active), last message preview (truncated at 50 chars), and per-conversation drafts. Sorted by `lastMessageTime` descending |
| `useFriendStore` | `friends`, `pendingRequests`, `searchResults` | Friend operations call `getIMClient()` (singleton accessor) to use WebSocket SDK. Notify events (`onFriendRequestReceived`, `onFriendAccepted`, `onFriendDeleted`) bridge real-time updates |

### 本地缓存（IndexedDB）

浏览器的会话数据落在 IndexedDB（`pomelo-web` 库），刷新/重开不再重新拉历史与头像：

- `src/utils/idb.ts` — 底层访问层，三个 store：`messages`（主键 `[peerId, id]` + `byPeerTime` 时间索引）、`media`（blob，`byAt` LRU 索引）、`kv`（快照/结论）。无 IDB 环境（Node 单测、隐私模式）统一降级为「无缓存」，调用方退回服务端路径。
- `src/utils/chatCache.ts` — 会话缓存域层：`hydrateChat`（登录时每会话恢复最近 `HYDRATE_PAGE=60` 条）、`persistMessagesDiff`（按行增量写，靠对象引用比较找变更行，删除只针对「上一状态有、这一状态没了」的行）、`loadOlderFromDb`（本地翻页，`LOCAL_PAGE=50`）、老数据迁移（一次性把 localStorage 的 `pomelo-chat` 搬进 IDB）、`cache:owner` 归属人（换账号清库防串号）。
- 写入时机：`useChatStore` 订阅自身变更后增量落库（上传中的占位气泡不落库）。
- 增量游标：C2C 离线水位 = 本地收到的最大 seq（`localInboxWatermark` → `IMClient.setSyncSeq` → `pullPending(seq > 水位)`）；群聊 = `groupPullCursor`（本地最大 seq，本地为空才拉最近一页）。都以「本地最大 seq」为准：已读水位可能被其他端推到本地消息之前，拿它当游标会永久跳过缺口。
- 翻页策略：`loadMoreHistory` 本地优先，本地到底才回落服务端；服务端确认「没有更早历史」的结论落库（`snap:serverExhausted`），刷新后不再重复询问。恢复页之外本地还有更早消息时，`hasMoreHistory` 保持 true 以便继续本地上翻。
- 媒体：`src/utils/mediaCache.ts` 内存 blob URL + IDB blob 两级缓存，缓存键是「去掉预签名查询串的 origin+path」（换头像 = 换对象路径 = 新键，预签名 URL 每次不同故不能直接作键），LRU 上限 2000 条 / 120MB，单条 >8MB 不落盘。
- 登出：清消息与快照（共用电脑不串号），媒体缓存保留（按对象路径寻址，不含会话内容）。

### Hook: `useIMClient` (`src/hooks/useIMClient.ts`)

Manages the `IMClient` singleton lifecycle. Key design decisions:

- `clientInstance` is a module-level variable — only one WebSocket connection exists
- `getIMClient()` is exported for stores to call SDK methods without importing the hook (avoids circular dependency between `useFriendStore` ↔ `useIMClient`)
- Event listeners bridge SDK events to stores: `message` → `useChatStore.onIncomingMessage` + `useConversationStore.onNewMessage`, `statusChange` → `useChatStore.onStatusChange`, friend notifies → `useFriendStore` handlers
- `connect()` catches promise rejection to avoid unhandled rejection on WebSocket errors
- `disconnect()` is called on component unmount (cleanup effect)

### HTTP API (`src/utils/api.ts`)

REST calls to `/api/*` proxied by Vite to `localhost:8888`. Endpoints: user register, user profile, friend list, pending friend requests. The `request()` helper handles 409 responses specially (not thrown as errors, returned as `{code: 409}`).

**Message history is fetched over WebSocket**, not HTTP. The `PULL_REQ`/`PULL_RESP` protocol (cmd `0x0030`/`0x0031`) serves dual purpose:
- **Without `peerId`** (body: `{userId, lastMsgId, limit}`): pulls offline undelivered messages (status < 2). Response messages are dispatched as events (`_onMessageReceived` → `'message'` event).
- **With `peerId`** (body: `{userId, peerId, lastMsgId, limit}`): pulls conversation history for a specific peer. The backend computes `conversationId` (sorted `userId:peerId`) and calls `pullConversation`, ordered by `created_at DESC` (backward pagination; `lastMsgId` carries a time cursor = the oldest message's `createdAt`). The frontend's `IMClient.pullHistory()` wraps this as a Promise (10s timeout), matching request to response by `messageId`. Results are returned directly to the caller without triggering `'message'` events or unread count changes.

### Routing (`src/App.tsx`)

Two lazy-loaded routes: `/login` (public) and `/chat` (protected via `ProtectedRoute` which redirects to `/login` if not authenticated). Root `/` redirects based on auth state.

### Components

- **Chat page** (`src/pages/Chat/index.tsx`): Main layout — 280px sidebar (conversation list or friends panel via tabs) + message area. Handles conversation selection, search, draft sync, logout (disconnects WebSocket → clears all stores → clears auth)
- **Login page** (`src/pages/Login/index.tsx`): Tabbed login/register form
- **MessageList**: Renders message bubbles, triggers `onLoadMore` when scrolled to top, auto-scrolls to bottom on new messages
- **MessageBubble**: Renders text/image/file messages with WeChat-style bubbles and status indicators (sending/sent/delivered/seen/failed with retry)

### Vite Config (`vite.config.ts`)

- Plugins: `@vitejs/plugin-react` + `@tailwindcss/vite`
- Proxy: `/api` → `http://localhost:8888`
- Code splitting: React → `vendor` chunk, Zustand → `state` chunk
