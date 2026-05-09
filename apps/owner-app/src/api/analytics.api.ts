import { apiClient } from './client';

export const analyticsApi = {
  getSummary: (facilityId?: string) =>
    apiClient.get<{ data: any }>('/analytics/owner/summary', { params: facilityId ? { facilityId } : {} }),

  getRevenueChart: (granularity: 'daily' | 'weekly' | 'monthly', facilityId?: string) =>
    apiClient.get<{ data: any[] }>('/analytics/owner/revenue-chart', {
      params: { granularity, ...(facilityId ? { facilityId } : {}) },
    }),

  getHeatmap: (facilityId?: string) =>
    apiClient.get<{ data: any[] }>('/analytics/owner/heatmap', { params: facilityId ? { facilityId } : {} }),

  getTopSlots: (facilityId?: string) =>
    apiClient.get<{ data: any[] }>('/analytics/owner/top-slots', { params: facilityId ? { facilityId } : {} }),

  getCancellationRate: (facilityId?: string) =>
    apiClient.get<{ data: any }>('/analytics/owner/cancellation-rate', { params: facilityId ? { facilityId } : {} }),
};
