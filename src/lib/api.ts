import { http } from "./http";

type AuthResponse = {
  ok: boolean;
  token?: string;
  refreshToken?: string;
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

export async function apiSignup(email: string, password: string): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>(
    "/auth/signup",
    { email, password },
    { skipAuthRefresh: true }
  );
  return res.data;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>(
    "/auth/login",
    { email, password },
    { skipAuthRefresh: true }
  );
  return res.data;
}

export async function apiGetProfile(): Promise<UserProfileResponse> {
  const res = await http.get<UserProfileResponse>("/api/profile");
  return res.data;
}

export async function apiUpdateProfile(payload: UserProfileUpdatePayload): Promise<UserProfileResponse> {
  const res = await http.put<UserProfileResponse>("/api/profile", payload);
  return res.data;
}
