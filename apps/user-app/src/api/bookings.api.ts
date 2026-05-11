import { apiClient } from './client';
import type { CreateBookingDtoType, CancelBookingDtoType } from '@yallaplay/shared-types';

export const bookingsApi = {
  create: (dto: CreateBookingDtoType) =>
    apiClient.post<{ data: any }>('/bookings', dto),

  getById: (id: string) =>
    apiClient.get<{ data: any }>(`/bookings/${id}`),

  cancel: (id: string, dto: CancelBookingDtoType) =>
    apiClient.delete<{ data: any }>(`/bookings/${id}`, { data: dto }),

  markSharedWhatsapp: (id: string) =>
    apiClient.patch(`/bookings/${id}/share-whatsapp`),

  markPaymentSubmitted: (id: string, screenshot?: string) =>
    apiClient.patch(`/bookings/${id}/payment-submitted`, screenshot ? { screenshot } : {}),

  getMyBookings: (filter: 'upcoming' | 'past' | 'all', page = 1, limit = 20) =>
    apiClient.get<{ data: { bookings: any[]; pagination: any } }>('/users/me/bookings', {
      params: { filter, page, limit },
    }),
};
