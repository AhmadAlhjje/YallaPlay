import { z } from 'zod';
import { SkillLevel, SportType, UserRole, PlanTier } from '../enums';

export const GeoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export const UserSchema = z.object({
  _id: z.string(),
  role: z.enum(UserRole),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+966\d{9}$/, 'يجب أن يبدأ الرقم بـ +966'),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  skillLevel: z.enum(SkillLevel).default('beginner'),
  preferredSports: z.array(z.enum(SportType)).default([]),
  location: GeoPointSchema.optional(),
  points: z.number().int().min(0).default(0),
  plan: z.enum(PlanTier).default('free'),
  planExpiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
  deviceTokens: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserDto = UserSchema.pick({
  name: true,
  phone: true,
  email: true,
  role: true,
}).partial({ email: true, role: true });

export const UpdateUserDto = UserSchema.pick({
  name: true,
  email: true,
  avatar: true,
  skillLevel: true,
  preferredSports: true,
  location: true,
}).partial();

export const UpdateLocationDto = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserDtoType = z.infer<typeof CreateUserDto>;
export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;
export type GeoPoint = z.infer<typeof GeoPointSchema>;
