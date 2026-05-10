import { z } from 'zod';
export declare const BookingSchema: z.ZodObject<{
    _id: z.ZodString;
    facilityId: z.ZodString;
    userId: z.ZodString;
    sport: z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>;
    date: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["pending_payment", "confirmed", "cancelled", "completed", "no_show"]>>;
    paymentMethod: z.ZodEnum<["qr_cash", "stc_pay", "mada", "points"]>;
    paymentStatus: z.ZodDefault<z.ZodEnum<["unpaid", "paid"]>>;
    totalPrice: z.ZodNumber;
    discountApplied: z.ZodDefault<z.ZodNumber>;
    qrToken: z.ZodOptional<z.ZodString>;
    confirmedAt: z.ZodOptional<z.ZodDate>;
    cancelledAt: z.ZodOptional<z.ZodDate>;
    cancellationReason: z.ZodOptional<z.ZodString>;
    pointsEarned: z.ZodDefault<z.ZodNumber>;
    reminderSent: z.ZodDefault<z.ZodBoolean>;
    sharedViaWhatsapp: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    date: string;
    status: "pending_payment" | "confirmed" | "cancelled" | "completed" | "no_show";
    _id: string;
    createdAt: Date;
    sport: "football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming";
    facilityId: string;
    userId: string;
    startTime: string;
    endTime: string;
    paymentMethod: "qr_cash" | "stc_pay" | "mada" | "points";
    paymentStatus: "unpaid" | "paid";
    totalPrice: number;
    discountApplied: number;
    pointsEarned: number;
    reminderSent: boolean;
    sharedViaWhatsapp: boolean;
    qrToken?: string | undefined;
    confirmedAt?: Date | undefined;
    cancelledAt?: Date | undefined;
    cancellationReason?: string | undefined;
    expiresAt?: Date | undefined;
}, {
    date: string;
    _id: string;
    createdAt: Date;
    sport: "football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming";
    facilityId: string;
    userId: string;
    startTime: string;
    endTime: string;
    paymentMethod: "qr_cash" | "stc_pay" | "mada" | "points";
    totalPrice: number;
    status?: "pending_payment" | "confirmed" | "cancelled" | "completed" | "no_show" | undefined;
    paymentStatus?: "unpaid" | "paid" | undefined;
    discountApplied?: number | undefined;
    qrToken?: string | undefined;
    confirmedAt?: Date | undefined;
    cancelledAt?: Date | undefined;
    cancellationReason?: string | undefined;
    pointsEarned?: number | undefined;
    reminderSent?: boolean | undefined;
    sharedViaWhatsapp?: boolean | undefined;
    expiresAt?: Date | undefined;
}>;
export declare const CreateBookingDto: z.ZodObject<{
    facilityId: z.ZodString;
    sport: z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>;
    date: z.ZodString;
    startTime: z.ZodString;
    paymentMethod: z.ZodEnum<["qr_cash", "stc_pay", "mada", "points"]>;
}, "strip", z.ZodTypeAny, {
    date: string;
    sport: "football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming";
    facilityId: string;
    startTime: string;
    paymentMethod: "qr_cash" | "stc_pay" | "mada" | "points";
}, {
    date: string;
    sport: "football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming";
    facilityId: string;
    startTime: string;
    paymentMethod: "qr_cash" | "stc_pay" | "mada" | "points";
}>;
export declare const SlotDto: z.ZodObject<{
    startTime: z.ZodString;
    endTime: z.ZodString;
    status: z.ZodEnum<["available", "booked", "pending", "closed"]>;
    price: z.ZodNumber;
    discountedPrice: z.ZodOptional<z.ZodNumber>;
    bookingId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "available" | "booked" | "pending" | "closed";
    startTime: string;
    endTime: string;
    price: number;
    discountedPrice?: number | undefined;
    bookingId?: string | undefined;
}, {
    status: "available" | "booked" | "pending" | "closed";
    startTime: string;
    endTime: string;
    price: number;
    discountedPrice?: number | undefined;
    bookingId?: string | undefined;
}>;
export declare const CancelBookingDto: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export type Booking = z.infer<typeof BookingSchema>;
export type CreateBookingDtoType = z.infer<typeof CreateBookingDto>;
export type SlotDtoType = z.infer<typeof SlotDto>;
export type CancelBookingDtoType = z.infer<typeof CancelBookingDto>;
//# sourceMappingURL=booking.schema.d.ts.map