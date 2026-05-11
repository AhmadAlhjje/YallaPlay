import { z } from 'zod';
import { SportType, BookingStatus, PaymentMethod, PaymentStatus } from '../enums';

export const BookingSchema = z.object({
  _id: z.string(),
  facilityId: z.string(),
  userId: z.string(),
  sport: z.enum(SportType),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ: YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
  status: z.enum(BookingStatus).default('pending_payment'),
  paymentMethod: z.enum(PaymentMethod),
  paymentStatus: z.enum(PaymentStatus).default('unpaid'),
  paymentSubmittedAt: z.date().optional(),
  totalPrice: z.number().positive(),
  discountApplied: z.number().min(0).default(0),
  qrToken: z.string().optional(),
  confirmedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  cancellationReason: z.string().optional(),
  pointsEarned: z.number().int().min(0).default(0),
  reminderSent: z.boolean().default(false),
  sharedViaWhatsapp: z.boolean().default(false),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

export const CreateBookingDto = z.object({
  facilityId: z.string(),
  sport: z.enum(SportType),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  paymentMethod: z.enum(PaymentMethod),
});

export const SlotDto = z.object({
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['available', 'booked', 'pending', 'closed']),
  price: z.number(),
  discountedPrice: z.number().optional(),
  bookingId: z.string().optional(),
});

export const CancelBookingDto = z.object({
  reason: z.string().max(500).optional(),
});

export type Booking = z.infer<typeof BookingSchema>;
export type CreateBookingDtoType = z.infer<typeof CreateBookingDto>;
export type SlotDtoType = z.infer<typeof SlotDto>;
export type CancelBookingDtoType = z.infer<typeof CancelBookingDto>;
