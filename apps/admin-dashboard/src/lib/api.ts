import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const ACCESS_KEY  = 'yp_admin_access';
const REFRESH_KEY = 'yp_admin_refresh';

export const getAccessToken  = () => Cookies.get(ACCESS_KEY) ?? null;
export const getRefreshToken = () => Cookies.get(REFRESH_KEY) ?? null;
export const saveTokens = (access: string, refresh: string) => {
  Cookies.set(ACCESS_KEY, access,  { expires: 1,  sameSite: 'strict' });
  Cookies.set(REFRESH_KEY, refresh, { expires: 30, sameSite: 'strict' });
};
export const clearTokens = () => {
  Cookies.remove(ACCESS_KEY);
  Cookies.remove(REFRESH_KEY);
};
export const isAuthenticated = () => !!getAccessToken();

export const apiClient: AxiosInstance = axios.create({ baseURL: BASE_URL });

// Attach Bearer on every request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent refresh on 401
let isRefreshing = false;
let queue: ((token: string) => void)[] = [];

const flush = (token: string) => { queue.forEach((cb) => cb(token)); queue = []; };

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refresh = getRefreshToken();
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh`, { refreshToken: refresh });
      const { accessToken, refreshToken: newRefresh } = data.data;
      saveTokens(accessToken, newRefresh);
      flush(accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── API namespaces ───────────────────────────────────────────────────────────

export const authApi = {
  sendOtp:   (phone: string) => apiClient.post('/auth/otp/send', { phone, role: 'admin' }),
  verifyOtp: (phone: string, otp: string) => apiClient.post<{ data: any }>('/auth/otp/verify', { phone, otp }),
  logout:    () => apiClient.post('/auth/logout'),
};

export const analyticsApi = {
  getPlatformSummary: () =>
    apiClient.get<{ data: any }>('/analytics/admin/summary'),

  getPlatformRevenue: (granularity: 'daily' | 'weekly' | 'monthly' = 'daily') =>
    apiClient.get<{ data: any[] }>('/analytics/admin/revenue-chart', { params: { granularity } }),

  getTopFacilities: (limit = 10) =>
    apiClient.get<{ data: any[] }>('/analytics/admin/top-facilities', { params: { limit } }),
};

export const adminApi = {
  // Users
  listUsers: (params?: { role?: string; plan?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: { users: any[]; pagination: any } }>('/admin/users', { params }),
  getUserDetail: (id: string) =>
    apiClient.get<{ data: any }>(`/admin/users/${id}`),
  suspendUser: (id: string) =>
    apiClient.patch(`/admin/users/${id}/suspend`),
  reactivateUser: (id: string) =>
    apiClient.patch(`/admin/users/${id}/reactivate`),
  overridePlan: (id: string, dto: { plan: string; planExpiresAt?: string }) =>
    apiClient.patch(`/admin/users/${id}/plan`, dto),

  // Facilities
  listFacilities: (params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) =>
    apiClient.get<{ data: { facilities: any[]; pagination: any } }>('/admin/facilities', { params }),
  getFacilityDetail: (id: string) =>
    apiClient.get<{ data: any }>(`/admin/facilities/${id}`),
  updateFacility: (id: string, dto: Record<string, any>) =>
    apiClient.patch<{ data: any }>(`/admin/facilities/${id}`, dto),
  suspendFacility: (id: string) =>
    apiClient.patch(`/admin/facilities/${id}/suspend`),
  restoreFacility: (id: string) =>
    apiClient.patch(`/admin/facilities/${id}/restore`),

  // Bookings
  listBookings: (params?: { page?: number; limit?: number; status?: string; search?: string; from?: string; to?: string }) =>
    apiClient.get<{ data: { bookings: any[]; pagination: any } }>('/admin/bookings', { params }),

  // Plan override by phone (finds user by phone, then overrides plan)
  overridePlanByPhone: async (phone: string, dto: { plan: string; planExpiresAt?: string }) => {
    const res = await apiClient.get('/admin/users', { params: { search: phone, limit: 1 } });
    const user = res.data?.data?.users?.[0];
    if (!user) throw new Error('المستخدم غير موجود');
    return apiClient.patch(`/admin/users/${user._id}/plan`, dto);
  },
};

export const plansApi = {
  getAll: () =>
    apiClient.get<{ data: any[] }>('/plans'),
  create: (dto: Record<string, any>) =>
    apiClient.post<{ data: any }>('/plans', dto),
  update: (id: string, dto: Partial<any>) =>
    apiClient.patch<{ data: any }>(`/plans/${id}`, dto),
  delete: (id: string) =>
    apiClient.delete(`/plans/${id}`),
};
