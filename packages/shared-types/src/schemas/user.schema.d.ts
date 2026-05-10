import { z } from 'zod';
export declare const GeoPointSchema: z.ZodObject<{
    type: z.ZodLiteral<"Point">;
    coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
}, "strip", z.ZodTypeAny, {
    type: "Point";
    coordinates: [number, number];
}, {
    type: "Point";
    coordinates: [number, number];
}>;
export declare const UserSchema: z.ZodObject<{
    _id: z.ZodString;
    role: z.ZodEnum<["athlete", "owner", "admin"]>;
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    skillLevel: z.ZodDefault<z.ZodEnum<["beginner", "intermediate", "pro"]>>;
    preferredSports: z.ZodDefault<z.ZodArray<z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>, "many">>;
    location: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    points: z.ZodDefault<z.ZodNumber>;
    plan: z.ZodDefault<z.ZodEnum<["free", "primer", "pro", "custom"]>>;
    planExpiresAt: z.ZodOptional<z.ZodDate>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    deviceTokens: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    role: "athlete" | "owner" | "admin";
    name: string;
    points: number;
    phone: string;
    _id: string;
    plan: "pro" | "free" | "primer" | "custom";
    skillLevel: "beginner" | "intermediate" | "pro";
    preferredSports: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[];
    isActive: boolean;
    deviceTokens: string[];
    createdAt: Date;
    updatedAt: Date;
    avatar?: string | undefined;
    email?: string | undefined;
    location?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    planExpiresAt?: Date | undefined;
}, {
    role: "athlete" | "owner" | "admin";
    name: string;
    phone: string;
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    points?: number | undefined;
    avatar?: string | undefined;
    plan?: "pro" | "free" | "primer" | "custom" | undefined;
    email?: string | undefined;
    skillLevel?: "beginner" | "intermediate" | "pro" | undefined;
    preferredSports?: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[] | undefined;
    location?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    planExpiresAt?: Date | undefined;
    isActive?: boolean | undefined;
    deviceTokens?: string[] | undefined;
}>;
export declare const CreateUserDto: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<["athlete", "owner", "admin"]>>;
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    role?: "athlete" | "owner" | "admin" | undefined;
    email?: string | undefined;
}, {
    name: string;
    phone: string;
    role?: "athlete" | "owner" | "admin" | undefined;
    email?: string | undefined;
}>;
export declare const UpdateUserDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    skillLevel: z.ZodOptional<z.ZodDefault<z.ZodEnum<["beginner", "intermediate", "pro"]>>>;
    preferredSports: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>, "many">>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    avatar?: string | undefined;
    email?: string | undefined;
    skillLevel?: "beginner" | "intermediate" | "pro" | undefined;
    preferredSports?: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[] | undefined;
    location?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
}, {
    name?: string | undefined;
    avatar?: string | undefined;
    email?: string | undefined;
    skillLevel?: "beginner" | "intermediate" | "pro" | undefined;
    preferredSports?: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[] | undefined;
    location?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
}>;
export declare const UpdateLocationDto: z.ZodObject<{
    longitude: z.ZodNumber;
    latitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    longitude: number;
    latitude: number;
}, {
    longitude: number;
    latitude: number;
}>;
export type User = z.infer<typeof UserSchema>;
export type CreateUserDtoType = z.infer<typeof CreateUserDto>;
export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;
export type GeoPoint = z.infer<typeof GeoPointSchema>;
//# sourceMappingURL=user.schema.d.ts.map