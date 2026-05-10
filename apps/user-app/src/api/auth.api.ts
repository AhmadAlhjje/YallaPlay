import { apiClient } from './client';
import type { SendOtpDtoType, VerifyOtpDtoType, AuthResponseDtoType } from '@yallaplay/shared-types';

interface LoginDto { phone: string; password: string; }
interface RegisterDto {
  name: string;
  phone: string;
  password: string;
  skillLevel?: string;
  preferredSports?: string[];
}

export const authApi = {
  register: (dto: RegisterDto) =>
    apiClient.post<{ data: AuthResponseDtoType & { isNewUser: boolean } }>('/auth/register', dto),

  login: (dto: LoginDto) =>
    apiClient.post<{ data: AuthResponseDtoType & { isNewUser: boolean } }>('/auth/login', dto),

  sendOtp: (dto: SendOtpDtoType) =>
    apiClient.post<{ data: { message: string } }>('/auth/otp/send', dto),

  verifyOtp: (dto: VerifyOtpDtoType) =>
    apiClient.post<{ data: AuthResponseDtoType }>('/auth/otp/verify', dto),

  logout: () =>
    apiClient.post('/auth/logout'),
};
