import { apiClient } from './client';

export const facilitiesApi = {
  getMyFacilities: () =>
    apiClient.get<{ data: any[] }>('/facilities/owner/my-facilities'),

  getById: (id: string) =>
    apiClient.get<{ data: any }>(`/facilities/${id}`),

  create: (dto: any) =>
    apiClient.post<{ data: any }>('/facilities', dto),

  update: (id: string, dto: any) =>
    apiClient.patch<{ data: any }>(`/facilities/${id}`, dto),

  softDelete: (id: string) =>
    apiClient.delete(`/facilities/${id}`),

  getSlots: (id: string, date: string) =>
    apiClient.get<{ data: any[] }>(`/facilities/${id}/slots`, { params: { date } }),
};
