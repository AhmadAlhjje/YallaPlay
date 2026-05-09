import { apiClient } from './client';

export const bookingsApi = {
  getFacilityBookings: (facilityId: string, params?: { date?: string; status?: string; page?: number }) =>
    apiClient.get<{ data: { bookings: any[]; pagination: any } }>(
      `/bookings/facility/${facilityId}`,
      { params },
    ),

  confirmQr: (qrToken: string) =>
    apiClient.post<{ data: any }>('/bookings/confirm-qr', { qrToken }),

  getById: (id: string) =>
    apiClient.get<{ data: any }>(`/bookings/${id}`),

  cancel: (id: string, reason: string) =>
    apiClient.delete(`/bookings/${id}`, { data: { reason } }),
};
