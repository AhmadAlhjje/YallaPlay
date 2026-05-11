import { apiClient } from './client';
import type { FacilitySearchDtoType, SlotDtoType } from '@yallaplay/shared-types';

export const facilitiesApi = {
  search: (params: Partial<FacilitySearchDtoType>) =>
    apiClient.get<{ data: { facilities: any[]; pagination: any } }>('/facilities', { params }),

  getById: (id: string) =>
    apiClient.get<{ data: any }>(`/facilities/${id}`),

  getSlots: (id: string, date: string) =>
    apiClient.get<{ data: SlotDtoType[] }>(`/facilities/${id}/slots`, { params: { date } }),

  getOffers: (facilityId: string, date: string) =>
    apiClient.get<{ data: any[] }>(`/offers/facility/${facilityId}`, { params: { date } }),

  rate: (facilityId: string, value: number) =>
    apiClient.post<{ data: { rating: number; ratingCount: number } }>(`/facilities/${facilityId}/rate`, { value }),

  getMyRating: (facilityId: string) =>
    apiClient.get<{ data: number | null }>(`/facilities/${facilityId}/my-rating`),
};

export const offersApi = {
  getActive: (limit = 10) =>
    apiClient.get<{ data: any[] }>('/offers/active', { params: { limit } }),
};
