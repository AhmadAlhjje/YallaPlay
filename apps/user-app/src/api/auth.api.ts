import { apiClient } from './client';
import type { SendOtpDtoType, VerifyOtpDtoType, AuthResponseDtoType } from '@yallaplay/shared-types';

export const authApi = {
  sendOtp: (dto: SendOtpDtoType) =>
    apiClient.post<{ data: { message: string } }>('/auth/otp/send', dto),

  verifyOtp: (dto: VerifyOtpDtoType) =>
    apiClient.post<{ data: AuthResponseDtoType }>('/auth/otp/verify', dto),

  logout: () =>
    apiClient.post('/auth/logout'),
};
