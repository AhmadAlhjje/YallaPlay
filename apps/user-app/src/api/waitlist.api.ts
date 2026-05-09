import { apiClient } from './client';
import type { JoinWaitlistDtoType } from '@yallaplay/shared-types';

export const waitlistApi = {
  join: (dto: JoinWaitlistDtoType) =>
    apiClient.post<{ data: any }>('/waitlist', dto),

  getMine: () =>
    apiClient.get<{ data: any[] }>('/waitlist'),

  leave: (id: string) =>
    apiClient.delete(`/waitlist/${id}`),
};
