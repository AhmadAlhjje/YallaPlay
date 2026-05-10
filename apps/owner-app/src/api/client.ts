import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const ACCESS_KEY  = 'yp_owner_access';
const REFRESH_KEY = 'yp_owner_refresh';

// ── Platform-safe storage ────────────────────────────────────────────────────
// expo-secure-store's deleteItemAsync uses a native method unavailable on web.
// On web we fall back to localStorage.

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

export const getAccessToken  = () => store.get(ACCESS_KEY);
export const getRefreshToken = () => store.get(REFRESH_KEY);
export const saveTokens = (access: string, refresh: string) =>
  Promise.all([
    store.set(ACCESS_KEY, access),
    store.set(REFRESH_KEY, refresh),
  ]);
export const clearTokens = () =>
  Promise.all([
    store.del(ACCESS_KEY),
    store.del(REFRESH_KEY),
  ]);

export const apiClient = axios.create({ baseURL: BASE_URL });

// Attach Bearer token
apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent refresh on 401
let isRefreshing = false;
let subscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => { subscribers.forEach((cb) => cb(token)); subscribers = []; };

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribers.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefresh } = data.data;
      await saveTokens(accessToken, newRefresh);
      onRefreshed(accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch {
      await clearTokens();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
