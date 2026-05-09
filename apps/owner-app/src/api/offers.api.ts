import { apiClient } from './client';

export const offersApi = {
  create: (dto: { facilityId: string; date: string; startTime: string; discountPercent: number }) =>
    apiClient.post<{ data: any }>('/offers', dto),

  getOwnerOffers: () =>
    apiClient.get<{ data: any[] }>('/offers/mine'),

  deactivate: (id: string) =>
    apiClient.delete(`/offers/${id}`),
};
