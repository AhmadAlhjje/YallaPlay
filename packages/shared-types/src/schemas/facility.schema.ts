import { z } from 'zod';
import { SportType, DayOfWeek } from '../enums';
import { GeoPointSchema } from './user.schema';

const OperatingHoursDaySchema = z
  .object({
    open: z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
    close: z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
  })
  .nullable();

export const FacilitySchema = z.object({
  _id: z.string(),
  ownerId: z.string(),
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  sports: z.array(z.enum(SportType)).min(1),
  images: z.array(z.string().url()).min(1).max(10),
  location: GeoPointSchema,
  address: z.string().min(5).max(300),
  phone: z.string(),
  slotDurationMinutes: z.number().int().min(30).max(180),
  operatingHours: z.record(z.enum(DayOfWeek), OperatingHoursDaySchema),
  pricePerSlot: z.number().positive(),
  currency: z.literal('SAR').default('SAR'),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  deletedAt: z.date().optional(),
  totalBookings: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateFacilityDto = FacilitySchema.omit({
  _id: true,
  ownerId: true,
  isActive: true,
  deletedAt: true,
  totalBookings: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateFacilityDto = CreateFacilityDto.partial();

export const FacilitySearchDto = z.object({
  query: z.string().optional(),
  sport: z.enum(SportType).optional(),
  longitude: z.number().optional(),
  latitude: z.number().optional(),
  radiusKm: z.number().positive().max(50).default(10),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['nearest', 'popular', 'rating', 'price_asc', 'price_desc']).default('popular'),
});

export type Facility = z.infer<typeof FacilitySchema>;
export type CreateFacilityDtoType = z.infer<typeof CreateFacilityDto>;
export type UpdateFacilityDtoType = z.infer<typeof UpdateFacilityDto>;
export type FacilitySearchDtoType = z.infer<typeof FacilitySearchDto>;
