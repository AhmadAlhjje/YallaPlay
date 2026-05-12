import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  if (Platform.OS === 'web') return envUrl;
  // In dev: auto-detect machine IP from the Expo bundler host
  if (__DEV__) {
    const c = Constants as any;
    const hostUri: string | undefined =
      c.expoConfig?.hostUri ??
      c.manifest?.debuggerHost ??
      c.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:3000/api/v1`;
    }
  }
  return envUrl;
}

const BASE_URL = resolveBaseUrl();

const SECURE_KEYS = {
  accessToken:  'yp_access_token',
  refreshToken: 'yp_refresh_token',
} as const;

// ── Platform-safe storage ────────────────────────────────────────────────────
// expo-secure-store's deleteItemAsync uses a native method unavailable on web.
// On web we fall back to localStorage (tokens are not sensitive in a browser context).

const store = {
  get: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.getItem(key));
    return SecureStore.getItemAsync(key);
  },
  set: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return Promise.resolve(); }
    return SecureStore.setItemAsync(key, value);
  },
  del: (key: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return Promise.resolve(); }
    return SecureStore.deleteItemAsync(key);
  },
};

// ── Token helpers ────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return store.get(SECURE_KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return store.get(SECURE_KEYS.refreshToken);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    store.set(SECURE_KEYS.accessToken, access),
    store.set(SECURE_KEYS.refreshToken, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    store.del(SECURE_KEYS.accessToken),
    store.del(SECURE_KEYS.refreshToken),
  ]);
}

// ── Axios instance ───────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Silent token refresh ─────────────────────────────────────────────────────
// Flag prevents parallel refresh calls when multiple requests fail at once

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function broadcastNewToken(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Response interceptor — 401 → silent refresh → retry original request
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue request until refresh completes
      return new Promise((resolve) => {
        subscribeRefresh((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refresh = await getRefreshToken();
      if (!refresh) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh`, {
        refreshToken: refresh,
      });

      const newAccess: string = data.data.accessToken;
      const newRefresh: string = data.data.refreshToken;

      await saveTokens(newAccess, newRefresh);
      broadcastNewToken(newAccess);

      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch {
      await clearTokens();
      // Signal auth store to log out
      refreshSubscribers = [];
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
