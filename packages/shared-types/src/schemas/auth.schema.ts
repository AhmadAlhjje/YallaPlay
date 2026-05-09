import { z } from 'zod';

export const SendOtpDto = z.object({
  phone: z.string().regex(/^\+963\d{9}$/, 'يجب أن يبدأ الرقم بـ +963'),
  role: z.enum(['athlete', 'owner', 'admin']).default('athlete'),
});

export const VerifyOtpDto = z.object({
  phone: z.string().regex(/^\+963\d{9}$/),
  otp: z.string().length(6, 'رمز التحقق مكون من 6 أرقام'),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string(),
});

export const JwtPayload = z.object({
  sub: z.string(),       // userId
  phone: z.string(),
  role: z.enum(['athlete', 'owner', 'admin']),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export const AuthResponseDto = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    _id: z.string(),
    name: z.string(),
    phone: z.string(),
    role: z.string(),
    avatar: z.string().optional(),
    points: z.number(),
    plan: z.string(),
  }),
});

export type SendOtpDtoType = z.infer<typeof SendOtpDto>;
export type VerifyOtpDtoType = z.infer<typeof VerifyOtpDto>;
export type JwtPayloadType = z.infer<typeof JwtPayload>;
export type AuthResponseDtoType = z.infer<typeof AuthResponseDto>;
