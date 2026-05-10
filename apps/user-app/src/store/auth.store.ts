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

      // Token exists → fetch fresh profile
      const { data } = await usersApi.getMe();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      // Token invalid or expired and refresh also failed
      await clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  sendOtp: async (phone: string) => {
    await authApi.sendOtp({ phone, role: 'athlete' });
  },

  verifyOtp: async (phone: string, otp: string) => {
    const { data } = await authApi.verifyOtp({ phone, otp });
    const { accessToken, refreshToken, user, isNewUser } = data.data;

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
    try {
      await authApi.logout();
    } catch {
      // Best-effort — clear tokens regardless
    }
    await clearTokens();
    set({ user: null, isAuthenticated: false, isNewUser: false });
  },
}));
