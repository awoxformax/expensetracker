import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "./config";
import {
  clearRefreshToken,
  clearToken,
  getRefreshToken,
  getToken,
  saveRefreshToken,
  saveToken,
} from "./storage";

export type HttpRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean;
};

type RefreshableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

type AuthResponseShape = {
  ok: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
};

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshingPromise: Promise<void> | null = null;
let logoutListener: (() => void) | null = null;

export async function primeTokensFromStorage() {
  const [storedAccess, storedRefresh] = await Promise.all([
    getToken(),
    getRefreshToken(),
  ]);
  accessToken = storedAccess;
  refreshToken = storedRefresh;
  return { accessToken, refreshToken };
}

export async function persistAuthTokens(
  nextAccess: string | null,
  nextRefresh?: string | null
) {
  accessToken = nextAccess;
  if (nextAccess) await saveToken(nextAccess);
  else await clearToken();

  if (typeof nextRefresh !== "undefined") {
    refreshToken = nextRefresh;
    if (nextRefresh) await saveRefreshToken(nextRefresh);
    else await clearRefreshToken();
  }
}

export function registerLogoutListener(listener: (() => void) | null) {
  logoutListener = listener;
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    const headers = axios.AxiosHeaders.from(
      config.headers as AxiosRequestHeaders | undefined
    );
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RefreshableRequestConfig | undefined;
    if (
      error.response?.status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      !originalConfig.skipAuthRefresh
    ) {
      originalConfig._retry = true;
      try {
        await refreshAccessToken();
        return http(originalConfig);
      } catch (refreshError) {
        await persistAuthTokens(null, null);
        logoutListener?.();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  if (!refreshToken) {
    throw new Error("Refresh token yoxdur");
  }

  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      const response = await refreshClient.post<AuthResponseShape>("/auth/refresh", {
        refreshToken,
      });
      if (!response.data?.ok || !response.data.token) {
        throw new Error(response.data?.error || "Token yenil?nm?di");
      }
      await persistAuthTokens(response.data.token, response.data.refreshToken ?? null);
    })().finally(() => {
      refreshingPromise = null;
    });
  }

  return refreshingPromise;
}
