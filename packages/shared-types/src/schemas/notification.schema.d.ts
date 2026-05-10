import { z } from 'zod';
export declare const NotificationSchema: z.ZodObject<{
    _id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["booking_confirmed", "booking_reminder", "booking_cancelled", "waitlist_available", "points_earned", "offer", "plan_upgraded", "plan_expired"]>;
    title: z.ZodString;
    body: z.ZodString;
    data: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    isRead: z.ZodDefault<z.ZodBoolean>;
    sentAt: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: "booking_confirmed" | "booking_reminder" | "booking_cancelled" | "waitlist_available" | "points_earned" | "offer" | "plan_upgraded" | "plan_expired";
    _id: string;
    createdAt: Date;
    userId: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    isRead: boolean;
    sentAt: Date;
}, {
    type: "booking_confirmed" | "booking_reminder" | "booking_cancelled" | "waitlist_available" | "points_earned" | "offer" | "plan_upgraded" | "plan_expired";
    _id: string;
    createdAt: Date;
    userId: string;
    title: string;
    body: string;
    sentAt: Date;
    data?: Record<string, unknown> | undefined;
    isRead?: boolean | undefined;
}>;
export type Notification = z.infer<typeof NotificationSchema>;
//# sourceMappingURL=notification.schema.d.ts.map