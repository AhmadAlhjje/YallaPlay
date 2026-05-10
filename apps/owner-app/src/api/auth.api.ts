import { apiClient } from './client';

export const authApi = {
  register: (dto: { name: string; phone: string; password: string; role: 'owner'; skillLevel?: string; preferredSports?: string[] }) =>
    apiClient.post<{ data: any }>('/auth/register', dto),
  login:   (phone: string, password: string) =>
    apiClient.post<{ data: any }>('/auth/login', { phone, password }),
  refresh: (refreshToken: string) => apiClient.post('/auth/token/refresh', { refreshToken }),
  logout:  () => apiClient.post('/auth/logout'),
};
