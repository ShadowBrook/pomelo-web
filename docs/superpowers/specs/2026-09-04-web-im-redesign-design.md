# pomelo-web 界面重构设计：复刻 RainbowChat-Web 风格

- 日期：2026-09-04
- 状态：待审阅
- 范围：布局 + 功能全面对齐（三期递进交付）

## 1. 背景与目标

参考 [RainbowChat-Web 功能截图](http://www.52im.net/thread-2470-1-1.html)（截图存档于 `/tmp/rbpw-shots/`），将现有微信风格全屏 SPA 重构为经典蓝桌面风格的"浮动多窗"IM。

**目标**

1. 布局架构复刻：主面板窗 + N 个独立聊天浮动窗（可拖动/全屏/关闭/多开并存），背景工作台 + 顶部导航条 + 右上角未读汇总气泡按钮
2. 视觉风格复刻：经典蓝主题、桌面客户端隐喻（右键菜单/Modal/Toast/系统横幅）、气泡样式
3. 功能全面对齐：消息操作（撤回/引用/转发/删除/@/快捷回复）+ 扩展消息与群管理（位置/名片/群公告/转让/解散/好友备注）
4. 仅复刻交互模式与视觉风格，不使用参考产品的任何代码、素材、品牌元素

**非目标**

- 不改动后端（Java）；新功能协议仅前端预留
- 不做响应式/移动端适配（桌面优先，与参考产品一致）
- 不实现音视频通话

## 2. 已确认的关键决策

| 决策点 | 结论 |
|---|---|
| 复刻范围 | 布局架构 + 视觉风格 + 功能全面对齐 |
| 后端配合 | 前端先行，协议号段预留，未就绪操作统一降级为 toast 提示 |
| 多窗 | 支持多聊天窗并存（与参考产品一致） |
| 分期 | 三期递进：P1 架构换肤 → P2 消息操作 → P3 扩展功能 |
| 技术栈 | 不变：React 19 + TS + Vite + Tailwind 4 + Zustand 5 + Vitest |

## 3. 总体架构

### 3.1 窗口模型

参考产品的实际结构是"**主面板窗 + N 个聊天窗**"：

- **主面板窗**（单例）：个人面板（头像/昵称/签名/设置）+ 三 tab（聊天/好友申请/群聊）+ 会话列表 + 底部连接状态条
- **聊天窗**（每会话一个）：标题栏（对方名/群名+人数、声音开关）+ 消息区 + 底部工具区 + 右侧详情栏
- 关闭主面板后聊天窗独立存活；右上角气泡按钮负责未读汇总与重新打开主面板

### 3.2 窗口状态（新增 `useWindowStore`）

```ts
interface WinInfo {
  id: string
  kind: 'main' | 'chat'
  peerId?: string              // kind='chat' 时存在，群聊为群 ID
  pos: { x: number; y: number }
  zIndex: number
  fullscreen: boolean
}

interface WindowActions {
  openMain(): void
  openChat(peerId: string): void   // 已开则 focus
  close(id: string): void
  focus(id: string): void          // 置顶（zIndex 递增计数器）
  move(id: string, pos: Pos): void
  toggleFullscreen(id: string): void
}
```

- 路由不变：`/login`、`/chat`。`/chat` 渲染：背景装饰层 + 顶部导航条 + `<WindowLayer />`
- `<WindowLayer />` 常驻，从 store 读 `windows` 数组 map 渲染，每窗 portal 到 `body`
- 现有 `useConversationStore.activePeerId` 保留，仅负责主面板选中高亮；窗口开关不再依赖它
- 聊天窗只是视图：消息数据统一在 `useChatStore`，多窗打开同一会话共享数据流

### 3.3 拖动与层级

- 拖动：pointer events（pointerdown/move/up）+ 标题栏捕获，位置写回 store；实现收敛在 `useWindowDrag` hook
- 全屏：`position: fixed; inset: 0`，退出恢复原 pos
- z 序：store 内自增计数器，点击窗口任意处 `focus`

## 4. 组件结构

```
<ChatPage>                        # /chat
├─ BackgroundLayer                # 装饰背景（预留业务嵌入）
├─ TopNavBar                      # logo + 消息气泡按钮（未读总和 badge）
└─ <WindowLayer>
   ├─ <DraggableWindow>           # 通用壳：标题栏/拖动/置顶/全屏/关闭
   │  └─ <MainPanel>              # kind='main'
   │     ├─ ProfileCard           # 头像/昵称/签名/设置入口
   │     ├─ PanelTabs             # 聊天 | 好友申请 | 群聊
   │     │  ├─ ConversationList   # ← 现有 ConversationItem 平移
   │     │  ├─ FriendsPanel       # ← 平移（含 AddFriendDialog 入口）
   │     │  └─ GroupPanel         # ← 平移（含 CreateGroupDialog 入口）
   │     └─ ConnStatusBar         # "● 通信正常"（← 现有 ConnectionBanner 改造）
   └─ <DraggableWindow fullscreen={...}>
      └─ <ChatWindowContent>      # kind='chat'
         ├─ ChatHeaderInfo        # 标题栏内容：对方名/群名+人数、声音开关
         ├─ MessageList           # ← 平移，触发 onLoadMore
         ├─ SystemBanner          # 米黄居中横幅（入群/退群/撤回提示）
         ├─ MessageToolbar        # 新：表情|文件|图片|名片|位置|@|清屏
         ├─ QuoteBar              # 新：引用条（P2）
         ├─ MessageInput          # ← 平移 + 快捷回复下拉（P2）
         └─ ChatDetailPanel       # 新右栏：1v1→好友信息 tab；群→群组信息 tab
```

平移原则：`MessageList`/`MessageBubble`/`MessageInput`/`EmojiPicker`/`AddFriendDialog`/`CreateGroupDialog` 只换样式不改逻辑；`useIMClient` 生命周期与四个现有 store 数据流不动。

新增通用组件：**ContextMenu**（右键菜单，危险项红色）、**Modal**（白卡片+标题栏+右上角X）、**Toast**（黑方块图标+白字，全局队列）、**SystemBanner**。

## 5. 视觉主题（Tailwind 4 `@theme`）

| Token | 值（提案） | 用途 |
|---|---|---|
| `--color-primary` | `#2E6BE6` | 主按钮/选中态/我方气泡 |
| `--color-primary-deep` | `#2456C4` | 标题栏渐变深端 |
| `--color-danger` | `#E64545` | 删除/解散/角标 |
| `--color-warn` | `#E6922E` | `[有人@我]` 等前缀标签 |
| `--color-ok` | `#3BB54A` | 在线/通信正常 |
| `--color-bg-page` | `#EDEFF3` | 背景工作台 |
| `--color-bubble-other` | `#F2F3F5` | 对方气泡 |

- 现有微信绿系 token 全部替换
- 气泡：我方蓝底白字右对齐 / 对方浅灰底左对齐，带尖角；方形圆角头像（8px）
- 时间戳居中灰色小字；圆角体系：卡片 6px、气泡 10px
- 深色顶部导航条（`#2B2F36` 一带）

## 6. P2：消息操作层

### 6.1 右键菜单

消息气泡注册菜单项：复制内容 / 撤回消息 / 转发消息 / 引用消息 / 删除消息。显隐规则：

- 复制：所有文本类消息
- 撤回：仅自己发出的消息
- 引用/转发：所有消息
- 删除：所有消息（仅删除本地记录）

### 6.2 撤回

- 协议：`MSG_RECALL_REQ=0x00B0 / RESP=0x00B1 / NOTIFY=0x00B2`（号段为提案，最终与后端约定为准）
- 交互：右键撤回 → 按钮态 → toast "消息撤回中" → RESP 成功后本地消息变居中灰条 "你撤回了一条消息"；收到 NOTIFY 的对端同理（"XX 撤回了一条消息"）
- 降级：RESP 超时或 `CMD_ERROR` → toast "功能开发中"，消息保持原样
- 撤回历史持久化：消息记录中保留 `recalled` 标记，历史拉取时按此渲染

### 6.3 引用与转发

- 引用：右键引用 → 输入框上方 QuoteBar（"Jack Jiang: [文件] x.pdf"，点击定位原消息）；消息体扩展字段 `quoteMessageId` + `quotePreview`（≤100字摘要）
- 转发：右键转发 → 弹出会话选择列表（复用会话列表数据）→ 将原消息重新经 C2C/C2G 发送至目标会话（本地新增一条消息记录，标记 `forwarded`）

### 6.4 @ 功能

- 触发：输入框键入 `@` 或点工具栏图标 → 群成员多选弹窗（复用 GroupPanel 成员数据；群主额外含"所有人"）
- 消息体扩展字段 `atUserIds: string[]`；`所有人` 用约定值（如 `*`）
- 接收端：命中的成员其会话列表前缀显示橙色 `[有人@我]`，优先级高于普通预览
- 输入框内 `@昵称` 以高亮 token 渲染（contenteditable 或标记文本方案，实现期定）

### 6.5 快捷回复

预设短语数组（如"正在处理紧急事情"），发送按钮右侧下拉菜单，点击即发送。

### 6.6 协议预留统一策略

- `Cmd` enum 中预定义全部新号段；SDK 层提供通用 `sendWithResp(cmd, body, respCmd, timeout)` 骨架（现有 `_sendFriendOp` 模式泛化）
- 后端未实现的命令：请求超时/错误 → 统一 toast "功能开发中"；UI 交互完整可点

## 7. P3：扩展功能

| 功能 | UI | 数据 |
|---|---|---|
| 位置消息 | 消息卡片（地址名+静态地图占位图）；工具栏入口弹位置选择（先占位） | 消息体 `location: {lat,lng,address}` |
| 个人/群名片消息 | 卡片样式（头像+名+ID，点击打开资料） | 消息体 `card: {type, peerId}` |
| 群公告 | 群组信息 tab 内公告区（群主可编辑） | 协议预留 `0x00C0~0x00C2` 或 HTTP |
| 转让/解散/移出成员 | 群组信息 tab 底部操作区（转让/解散红色） | 协议预留 `0x00C3~0x00C6` |
| 好友备注 | 好友信息 tab "设置备注"表单 | 协议预留或 HTTP |
| 语音/短视频消息 | 只读播放（`<audio>`/`<video>`，来自 APP 端消息） | 现有媒体 URL 字段 |

## 8. 错误处理

- 窗口关闭：清理该窗的加载定时器与滚动状态；store 中移除窗口
- 断线：主面板底部状态条变红 "通信中断，重连中"；右上角气泡按钮同步变色；恢复后自动清除
- 协议未就绪操作：统一 toast 降级（见 6.6）
- 多窗同会话：数据层单源（useChatStore），窗口仅视图，无同步问题

## 9. 测试策略

- **单测（Vitest）**：
  - `useWindowStore`：open/close/focus z 序/fullscreen/重复 openChat 去重
  - 消息操作 reducer：撤回态迁移、引用摘要组装、`@` 文本解析与 atUserIds 提取
  - 未读汇总 selector（右上角 badge）
- **组件测试**：ContextMenu 显隐规则、QuoteBar 组装
- **手动验收（dev server）**：多窗开关/拖动/全屏、右键菜单、主题走查、断线恢复

## 10. 交付分期

| 期 | 内容 | 验收标准 |
|---|---|---|
| P1 | 窗口架构（主面板+多聊天窗+拖动/全屏/关闭+未读汇总）+ 蓝色主题全套 + 现有功能平移（单聊/群聊/好友/表情/图片/文件/历史） | 可日常使用；多窗交互流畅 |
| P1.5 | 聊天窗结构复刻精修（见 §12，2026-09-05 增补） | 聊天窗三区结构与参考截图一致 |
| P2 | 右键菜单/撤回/引用/转发/删除/@/清屏 + 协议预留骨架 | 菜单与降级提示可用；后端就绪后无缝接通 |
| P3 | 位置/名片/群公告/转让解散/好友备注/音视频展示 | 各功能 UI 完整、降级策略一致 |

## 11. 风险与开放问题

1. **当前分支 `refactor/remove-json-codec`**（Protobuf 迁移）未合并——本重构涉及 `MessageInput`/`MessageBubble` 等同区域文件，建议先合并该分支再动工，或在其之上开新分支
2. 消息体扩展字段（quote/at/card/location）的编码方式依赖 Protobuf 迁移后的消息结构，需在实现 P2 前与后端对齐消息体 schema
3. `@昵称` 输入框 token 渲染方案（contenteditable vs 标记文本）在实现期根据现有 MessageInput 结构定
4. 好友相册/语音介绍 tab 在 P1/P2 仅做占位 UI，数据能力依赖后端后续提供

## 12. P1.5：聊天窗结构复刻精修（2026-09-05 增补，用户已确认）

P1 验收后用户反馈：功能正确，但聊天窗结构与参考截图（存档 `/tmp/rbpw-shots/7_friend_chat.jpg` 一类）不一致。本轮按参考图复刻聊天窗三区结构。

### 12.1 聊天窗布局（核心）

聊天窗 = **左聊天区 + 右详情栏**（中间分隔线）：

- **双段标题栏**：左段（深蓝）= 当前登录用户卡（头像/昵称/签名/⚙ → 打开"我的个人信息"弹窗，本轮仅弹窗占位）；右段 = 对方名 + 标签（陌生人"陌"/群聊）+ 🔊（视觉开关，实际静音功能后续期）+ ⛶ + ✕
- **左聊天区**：消息区（现状）+ 底部区重排：工具栏图标行 → 输入框 → 底行（左：`● 通信正常` 连接状态；右：`按 Ctrl+Enter 换行，按 Enter 发送` + **发送+▼组合按钮**）
- **快捷回复（自 P2 提前）**：▼ 展开预设短语浮层（`正在处理紧急事情` / `有事先离开一会儿`），点击直接发送
- **Ctrl+Enter 换行**：输入框 Enter 发送（现状），Ctrl+Enter 插入换行
- **右详情栏 `ChatDetailPanel`**：三 tab
  - 对方信息：头像/昵称/签名/基本信息（ID号等，缺失字段显示 `—`）；好友 → "删除好友"按钮，陌生人 → "加为好友"按钮（复用现有 SDK 好友操作）
  - 对方相册 / 语音介绍：**UI + 空态**（"暂无相册"/"暂无语音介绍"），数据接口后端就绪后填入
- **气泡修正**：`--color-bubble-self` 改浅蓝（`#D9E8FF`）+ 深色字（参考图我方气泡为浅蓝底深字，P1 做成了蓝底白字）

### 12.2 主面板精修

- 图标 tab（消息/申请/群聊，行内 SVG 线性图标），申请 tab 红点角标 = `pendingRequests.length`
- 个人卡签名行；会话列表上方 `交谈 X / 未读 Y` 统计行 + 蓝色 ➕
- 会话项"陌"角标：type=c2c 且 peer 不在好友列表时，头像左上橙色 `陌` 标

### 12.3 数据边界（已向用户说明）

- 对方信息字段以现有数据为准（FriendStore + `getProfile`），后端未返回的字段显示 `—`
- 对方相册/语音介绍本轮无数据源，空态展示
- 声音按钮为视觉开关（实际通知音实现留后续期）

### 12.4 主面板与聊天窗对接模式（2026-09-05 第二轮，用户反馈后增补）

用户验收反馈：主面板与聊天窗不应分离，须按参考截图复刻为**无缝对接的一体面板**（蓝色标题栏连续贯穿）。参考产品实际为相邻两窗（可拖开独立），故实现为**对接模式**：

1. **dock-on-open**：`openChat` 时聊天窗自动吸附主面板右缘——`pos = {x: main.pos.x + MAIN_PANEL_WIDTH, y: main.pos.y}`，标记 `snapped: true`；拖动聊天窗或主面板任一窗口即解除吸附（`snapped: false`，恢复独立浮窗与圆角）；关闭主面板同样解除全部吸附。主面板未开时回退级联偏移
2. **等高**：主面板与聊天窗统一高度 580
3. **接缝**：对接时主窗右下/右上角与聊天窗左下/左上角取直角（`rounded-*-none`），聊天窗左边框保留作列分隔线
4. **主面板标题栏换头**：移除"消息"标题与 ⛶/✕ 控件，改为**用户卡**（头像/昵称/⚙→个人信息弹窗，自 ChatWindowHeader 抽出复用）；聊天窗标题栏仅保留对方段+声音开关（参考图 24_revoke：拖开的聊天窗只有对方名）；右上角 💬 按钮改为主面板开/关切换
5. `MAIN_PANEL_WIDTH` 常量随 dock 数学移入 `useWindowStore` 模块并导出
