import { z } from 'zod';
export declare const WaitlistSchema: z.ZodObject<{
    _id: z.ZodString;
    facilityId: z.ZodString;
    date: z.ZodString;
    startTime: z.ZodString;
    userId: z.ZodString;
    position: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["waiting", "notified", "converted", "expired"]>>;
    notifiedAt: z.ZodOptional<z.ZodDate>;
    expiresAt: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    date: string;
    status: "waiting" | "notified" | "converted" | "expired";
    _id: string;
    createdAt: Date;
    facilityId: string;
    userId: string;
    startTime: string;
    expiresAt: Date;
    position: number;
    notifiedAt?: Date | undefined;
}, {
    date: string;
    _id: string;
    createdAt: Date;
    facilityId: string;
    userId: string;
    startTime: string;
    expiresAt: Date;
    position: number;
    status?: "waiting" | "notified" | "converted" | "expired" | undefined;
    notifiedAt?: Date | undefined;
}>;
export declare const JoinWaitlistDto: z.ZodObject<{
    facilityId: z.ZodString;
    date: z.ZodString;
    startTime: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: string;
    facilityId: string;
    startTime: string;
}, {
    date: string;
    facilityId: string;
    startTime: string;
}>;
export type Waitlist = z.infer<typeof WaitlistSchema>;
export type JoinWaitlistDtoType = z.infer<typeof JoinWaitlistDto>;
//# sourceMappingURL=waitlist.schema.d.ts.map