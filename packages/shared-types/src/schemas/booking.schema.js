"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelBookingDto = exports.SlotDto = exports.CreateBookingDto = exports.BookingSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.BookingSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    facilityId: zod_1.z.string(),
    userId: zod_1.z.string(),
    sport: zod_1.z.enum(enums_1.SportType),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ: YYYY-MM-DD'),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
    endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
    status: zod_1.z.enum(enums_1.BookingStatus).default('pending_payment'),
    paymentMethod: zod_1.z.enum(enums_1.PaymentMethod),
    paymentStatus: zod_1.z.enum(enums_1.PaymentStatus).default('unpaid'),
    totalPrice: zod_1.z.number().positive(),
    discountApplied: zod_1.z.number().min(0).default(0),
    qrToken: zod_1.z.string().optional(),
    confirmedAt: zod_1.z.date().optional(),
    cancelledAt: zod_1.z.date().optional(),
    cancellationReason: zod_1.z.string().optional(),
    pointsEarned: zod_1.z.number().int().min(0).default(0),
    reminderSent: zod_1.z.boolean().default(false),
    sharedViaWhatsapp: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.date(),
    expiresAt: zod_1.z.date().optional(),
});
exports.CreateBookingDto = zod_1.z.object({
    facilityId: zod_1.z.string(),
    sport: zod_1.z.enum(enums_1.SportType),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    paymentMethod: zod_1.z.enum(enums_1.PaymentMethod),
});
exports.SlotDto = zod_1.z.object({
    startTime: zod_1.z.string(),
    endTime: zod_1.z.string(),
    status: zod_1.z.enum(['available', 'booked', 'pending', 'closed']),
    price: zod_1.z.number(),
    discountedPrice: zod_1.z.number().optional(),
    bookingId: zod_1.z.string().optional(),
});
exports.CancelBookingDto = zod_1.z.object({
    reason: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=booking.schema.js.map