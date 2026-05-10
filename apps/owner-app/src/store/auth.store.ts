import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { apiClient, saveTokens, clearTokens, getAccessToken } from '../api/client';

interface Owner {
  _id: string;
  name: string;
  phone: string;
  role: 'owner';
  plan: string;
  planExpiresAt?: string;
}

interface AuthState {
  owner: Owner | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  owner: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await getAccessToken();
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await apiClient.get('/users/me');
      const owner = data.data;
      if (owner.role !== 'owner') throw new Error('not an owner');
      set({ owner, isAuthenticated: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ owner: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (name, phone, password) => {
    const { data } = await authApi.register({ name, phone, password, role: 'owner' });
    const { accessToken, refreshToken, user } = data.data;
    if (user.role !== 'owner') throw new Error('ليس حساب مالك ملعب');
    await saveTokens(accessToken, refreshToken);
    set({ owner: user, isAuthenticated: true });
  },

  login: async (phone, password) => {
    const { data } = await authApi.login(phone, password);
    const { accessToken, refreshToken, user } = data.data;
    if (user.role !== 'owner') throw new Error('هذا الحساب ليس حساب مالك ملعب');
    await saveTokens(accessToken, refreshToken);
    set({ owner: user, isAuthenticated: true });
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* best-effort */ }
    await clearTokens();
    set({ owner: null, isAuthenticated: false });
  },
}));
