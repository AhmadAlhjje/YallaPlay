import { apiClient } from './client';

export const authApi = {
  sendOtp:  (phone: string) => apiClient.post('/auth/otp/send', { phone, role: 'owner' }),
  verifyOtp:(phone: string, otp: string) => apiClient.post<{ data: any }>('/auth/otp/verify', { phone, otp }),
  refresh:  (refreshToken: string) => apiClient.post('/auth/token/refresh', { refreshToken }),
  logout:   () => apiClient.post('/auth/logout'),
};
