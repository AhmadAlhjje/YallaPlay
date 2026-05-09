import { apiClient } from './client';
import type { UpdateUserDtoType } from '@yallaplay/shared-types';

export const usersApi = {
  getMe: () =>
    apiClient.get<{ data: any }>('/users/me'),

  updateMe: (dto: UpdateUserDtoType) =>
    apiClient.patch<{ data: any }>('/users/me', dto),

  updateLocation: (longitude: number, latitude: number) =>
    apiClient.patch('/users/me/location', { longitude, latitude }),

  getPoints: () =>
    apiClient.get<{ data: { points: number } }>('/users/me/points'),

  getPointsHistory: (page = 1) =>
    apiClient.get<{ data: any[] }>('/users/me/points/history', { params: { page } }),

  addDeviceToken: (token: string) =>
    apiClient.post('/users/me/device-token', { token }),
};
