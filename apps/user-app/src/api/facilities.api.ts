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
};
