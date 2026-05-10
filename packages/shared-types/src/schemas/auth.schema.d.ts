import { z } from 'zod';
export declare const SendOtpDto: z.ZodObject<{
    phone: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["athlete", "owner", "admin"]>>;
}, "strip", z.ZodTypeAny, {
    role: "athlete" | "owner" | "admin";
    phone: string;
}, {
    phone: string;
    role?: "athlete" | "owner" | "admin" | undefined;
}>;
export declare const VerifyOtpDto: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const RefreshTokenDto: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const JwtPayload: z.ZodObject<{
    sub: z.ZodString;
    phone: z.ZodString;
    role: z.ZodEnum<["athlete", "owner", "admin"]>;
    iat: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    role: "athlete" | "owner" | "admin";
    sub: string;
    phone: string;
    iat?: number | undefined;
    exp?: number | undefined;
}, {
    role: "athlete" | "owner" | "admin";
    sub: string;
    phone: string;
    iat?: number | undefined;
    exp?: number | undefined;
}>;
export declare const AuthResponseDto: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    user: z.ZodObject<{
        _id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodString;
        role: z.ZodString;
        avatar: z.ZodOptional<z.ZodString>;
        points: z.ZodNumber;
        plan: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: string;
        name: string;
        points: number;
        phone: string;
        _id: string;
        plan: string;
        avatar?: string | undefined;
    }, {
        role: string;
        name: string;
        points: number;
        phone: string;
        _id: string;
        plan: string;
        avatar?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    accessToken: string;
    user: {
        role: string;
        name: string;
        points: number;
        phone: string;
        _id: string;
        plan: string;
        avatar?: string | undefined;
    };
}, {
    refreshToken: string;
    accessToken: string;
    user: {
        role: string;
        name: string;
        points: number;
        phone: string;
        _id: string;
        plan: string;
        avatar?: string | undefined;
    };
}>;
export type SendOtpDtoType = z.infer<typeof SendOtpDto>;
export type VerifyOtpDtoType = z.infer<typeof VerifyOtpDto>;
export type JwtPayloadType = z.infer<typeof JwtPayload>;
export type AuthResponseDtoType = z.infer<typeof AuthResponseDto>;
//# sourceMappingURL=auth.schema.d.ts.map