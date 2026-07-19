const BASE_URL = '/api';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  userId?: string;
  // 允许后端返回的额外字段（如 friends/users/pending）直接挂在顶层
  [key: string]: any;
}

async function request<T = any>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // 处理 409（用户已存在 / 已发送过好友申请）作为带 code 的特殊响应
  if (res.status === 409) {
    try {
      const body = await res.json();
      return { code: body.code ?? 409, message: body.message || 'User already exists' };
    } catch {
      return { code: 409, message: 'User already exists' };
    }
  }

  if (!res.ok) {
    // 尝试解析错误响应体中的 message，给调用方更准确的信息
    let errMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.message) errMsg = body.message;
    } catch {
      // 响应体非 JSON，忽略
    }
    throw new Error(errMsg);
  }

  return res.json();
}

// 用户注册（也用作登录，因后端无独立 login API）
export async function register(userId: string, nickname: string, password: string, avatar?: string) {
  return request('/user/register', {
    method: 'POST',
    body: JSON.stringify({ userId, nickname, password, avatar: avatar || '' }),
  });
}

// 查询用户信息
export async function getProfile(userId: string) {
  return request<{ userId: string; nickname: string; avatar: string; status: number }>(
    `/user/${userId}/profile`
  );
}

// 健康检查
export async function healthCheck() {
  return request('/health');
}

// 好友列表（仅已接受的）
export async function getFriends(userId: string) {
  return request<
    { userId: string; nickname: string; avatar: string; online: boolean; friendedAt: number }[]
  >(`/friends/${userId}`);
}

// 获取待处理的好友申请
export async function getPendingFriends(userId: string) {
  return request<
    { userId: string; nickname: string; avatar: string; requestedAt: number }[]
  >(`/friends/${userId}/pending`);
}

// 历史消息（后端返回结构）
export interface HistoryMessage {
  id: number; // 雪花 ID（Long）
  senderId: string;
  recipientId: string;
  seq: number;
  msgType: number; // 1=text, 2=image, 3=file, 4=emoji
  content: string;
  createdAt: number;
}

// 拉取历史消息（按 seq ASC 返回，最早在前）
export async function getMessageHistory(
  userId: string,
  peerId: string,
  beforeSeq?: number,
  limit = 50,
) {
  const params = new URLSearchParams({ peerId, limit: String(limit) });
  if (beforeSeq && beforeSeq > 0) params.set('beforeSeq', String(beforeSeq));
  // 后端响应：{ code, messages, hasMore }，因 ApiResponse 有 [key: string]: any，
  // messages / hasMore 会直接挂在返回对象顶层
  return request<{ messages: HistoryMessage[]; hasMore: boolean }>(
    `/messages/${userId}/history?${params.toString()}`,
  );
}
