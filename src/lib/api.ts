import { API_BASE_URL } from './config';

type AuthResponse = {
  ok: boolean;
  token?: string;
  user?: { id: string; email: string };
  error?: string;
};

export type RemoteCategoryPayload = {
  id: string;
  name: string;
  description?: string;
  period?: 'daily' | 'monthly';
  icon?: string;
  type?: 'income' | 'expense';
};

export type UserProfileResponse = {
  ok: boolean;
  data?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    persona?: string | null;
    incomeType?: string | null;
    budget?: number | null;
    categories: RemoteCategoryPayload[];
    onboardingCompleted?: boolean;
  };
  error?: string;
};

export type UserProfileUpdatePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  persona?: string | null;
  incomeType?: string | null;
  budget?: number | null;
  onboardingCompleted?: boolean;
  categories?: RemoteCategoryPayload[];
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
    return { ok: false, error: 'Network error. Could not reach server.' } as unknown as T;
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

export async function apiGetProfile(token: string) {
  return request<UserProfileResponse>('/api/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function apiUpdateProfile(token: string, payload: UserProfileUpdatePayload) {
  return request<UserProfileResponse>('/api/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
