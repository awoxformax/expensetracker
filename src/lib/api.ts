import { API_BASE_URL } from './config';

type AuthResponse = {
  ok: boolean;
  token?: string;
  user?: { id: string; email: string };
  error?: string;
};

async function request<T>(path: string, options: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const data = (await res.json()) as T;
    return data;
  } catch (e) {
    // Fallback shape for callers expecting { ok, error }
    return { ok: false, error: 'Şəbəkə xətası. Serverə qoşulmaq mümkün olmadı.' } as unknown as T;
  }
}

export async function apiSignup(email: string, password: string) {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogin(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
