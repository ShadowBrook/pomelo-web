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

  // 401 → 默认按 token 失效处理（触发登出）。登录/注册的 401 是凭证错误，单独处理。
  if (res.status === 401) {
    let msg = '登录已过期，请重新登录';
    try {
      const body = await res.json();
      if (body.message) msg = body.message;
    } catch {
      // 响应体非 JSON，保留默认文案
    }
    // 登录/注册 401 = 用户名不存在/密码错误，不是 token 过期，不清 token、不提示过期
    if (path.startsWith('/user/login') || path.startsWith('/user/register')) {
      throw new Error(msg);
    }
    const { useAuthStore } = await import('@/stores/useAuthStore');
    useAuthStore.getState().logout();
    throw new Error(msg);
  }

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

// 用户注册（入参 userName 替代原来的 userId）
export async function register(userName: string, nickname: string, password: string, avatar?: string) {
  return request('/user/register', {
    method: 'POST',
    body: JSON.stringify({ userName, nickname, password, avatar: avatar || '' }),
  });
}

// 用户登录（platform 写入 token，供 gateway setCodec 多端预留）
export async function login(userName: string, password: string) {
  return request<{ userId: string; userName: string; nickname: string; avatar: string }>(
    '/user/login',
    {
      method: 'POST',
      body: JSON.stringify({ userName, password, platform: 'web' }),
    },
  );
}

// 查询用户信息
export async function getProfile(userId: string) {
  return request<{ userId: string; userName: string; nickname: string; avatar: string; status: number }>(
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
    { userId: string; userName: string; nickname: string; avatar: string; online: boolean; friendedAt: number }[]
  >(`/friends/${userId}`);
}

// 获取待处理的好友申请
export async function getPendingFriends(userId: string) {
  return request<
    { userId: string; userName: string; nickname: string; avatar: string; requestedAt: number }[]
  >(`/friends/${userId}/pending`);
}
