const BASE_URL = '/api';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  userId?: string;
}

async function request<T = any>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // 处理 409（用户已存在）作为特殊成功
  if (res.status === 409) {
    return { code: 409, message: 'User already exists' };
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
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

// 好友列表（后端当前返回空列表）
export async function getFriends(userId: string) {
  return request<{ userId: string; friends: any[] }>(`/friends/${userId}`);
}
