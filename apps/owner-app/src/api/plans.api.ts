import { apiClient } from './client';

export const plansApi = {
  getPublic: () =>
    apiClient.get<{ data: any[] }>('/plans'),

  getMyStatus: () =>
    apiClient.get<{ data: any }>('/plans/my-status'),

  upgrade: (planId: string) =>
    apiClient.post<{ data: any }>('/plans/upgrade', { planId }),
};
