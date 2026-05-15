import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import { getAccessToken, saveTokens, clearTokens } from '../api/client';

interface User {
  _id: string;
  name: string;
  phone: string;
  role: string;
  avatar?: string;
  points: number;
  plan: string;
  skillLevel?: string;
  preferredSports?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;

  // Actions
  initialize: () => Promise<void>;
  register: (name: string, phone: string, password: string, skillLevel?: string, preferredSports?: string[]) => Promise<{ requiresOtp: boolean }>;
  login: (phone: string, password: string) => Promise<{ requiresOtp: boolean }>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isNewUser: false,

  // Called once at app launch — restores session from secure storage
  initialize: async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const { data } = await usersApi.getMe();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      // 404 = user deleted from DB; 401 = token invalid/expired
      await clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (name, phone, password, skillLevel, preferredSports) => {
    await authApi.register({ name, phone, password, skillLevel, preferredSports });
    await clearTokens();
    set({ user: null, isAuthenticated: false, isNewUser: true });
    return { requiresOtp: true };
  },

  login: async (phone, password) => {
    const { data } = await authApi.login({ phone, password });
    const { accessToken, refreshToken, user, isNewUser } = data.data;

    if (isNewUser) {
      await clearTokens();
      set({ user: null, isAuthenticated: false, isNewUser: true });
      return { requiresOtp: true };
    }

    await saveTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true, isNewUser: false });
    return { requiresOtp: false };
  },

  sendOtp: async (phone: string) => {
    const res = await authApi.sendOtp({ phone, role: 'athlete' });
    if (__DEV__) {
      const msg = (res as any)?.data?.data?.message ?? '';
      if (msg.startsWith('OTP:')) console.log('[DEV OTP]', msg);
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    const { data } = await authApi.verifyOtp({ phone, otp });
    const { accessToken, refreshToken, user, isNewUser } = data.data as any;

    await saveTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true, isNewUser: !!isNewUser });
  },

  refreshProfile: async () => {
    const { data } = await usersApi.getMe();
    set({ user: data.data });
  },

  updateUser: (partial: Partial<User>) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...partial } });
  },

  logout: async () => {
    // Fire-and-forget logout to backend while token is still in storage
    authApi.logout().catch(() => undefined);
    await clearTokens();
    set({ user: null, isAuthenticated: false, isNewUser: false });
  },
}));
