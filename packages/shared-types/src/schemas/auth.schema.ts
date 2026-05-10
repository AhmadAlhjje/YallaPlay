import { z } from 'zod';

export const RegisterDto = z.object({
  name: z.string().min(2, 'الاسم مطلوب').max(50),
  phone: z.string().regex(/^\+963\d{9}$/, 'يجب أن يبدأ الرقم بـ +963'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(100),
  role: z.enum(['athlete', 'owner']).optional().default('athlete'),
  skillLevel: z.enum(['beginner', 'intermediate', 'pro']).optional(),
  preferredSports: z.array(z.enum(['football', 'basketball', 'tennis', 'volleyball', 'padel', 'squash', 'badminton', 'swimming'])).optional(),
});

export const LoginDto = z.object({
  phone: z.string().regex(/^\+963\d{9}$/, 'يجب أن يبدأ الرقم بـ +963'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

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

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type SendOtpDtoType = z.infer<typeof SendOtpDto>;
export type VerifyOtpDtoType = z.infer<typeof VerifyOtpDto>;
export type JwtPayloadType = z.infer<typeof JwtPayload>;
export type AuthResponseDtoType = z.infer<typeof AuthResponseDto>;
