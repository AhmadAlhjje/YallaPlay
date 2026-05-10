import { z } from 'zod';
export declare const FacilitySchema: z.ZodObject<{
    _id: z.ZodString;
    ownerId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sports: z.ZodArray<z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>, "many">;
    images: z.ZodArray<z.ZodString, "many">;
    location: z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>;
    address: z.ZodString;
    phone: z.ZodString;
    slotDurationMinutes: z.ZodNumber;
    operatingHours: z.ZodRecord<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, z.ZodNullable<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        open: string;
        close: string;
    }, {
        open: string;
        close: string;
    }>>>;
    pricePerSlot: z.ZodNumber;
    currency: z.ZodDefault<z.ZodLiteral<"SAR">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    deletedAt: z.ZodOptional<z.ZodDate>;
    totalBookings: z.ZodDefault<z.ZodNumber>;
    rating: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    tags: string[];
    phone: string;
    _id: string;
    location: {
        type: "Point";
        coordinates: [number, number];
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    sports: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[];
    images: string[];
    address: string;
    slotDurationMinutes: number;
    operatingHours: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", {
        open: string;
        close: string;
    } | null>>;
    pricePerSlot: number;
    currency: "SAR";
    totalBookings: number;
    rating: number;
    description?: string | undefined;
    deletedAt?: Date | undefined;
}, {
    name: string;
    phone: string;
    _id: string;
    location: {
        type: "Point";
        coordinates: [number, number];
    };
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    sports: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[];
    images: string[];
    address: string;
    slotDurationMinutes: number;
    operatingHours: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", {
        open: string;
        close: string;
    } | null>>;
    pricePerSlot: number;
    description?: string | undefined;
    tags?: string[] | undefined;
    isActive?: boolean | undefined;
    currency?: "SAR" | undefined;
    deletedAt?: Date | undefined;
    totalBookings?: number | undefined;
    rating?: number | undefined;
}>;
export declare const CreateFacilityDto: z.ZodObject<Omit<{
    _id: z.ZodString;
    ownerId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sports: z.ZodArray<z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>, "many">;
    images: z.ZodArray<z.ZodString, "many">;
    location: z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>;
    address: z.ZodString;
    phone: z.ZodString;
    slotDurationMinutes: z.ZodNumber;
    operatingHours: z.ZodRecord<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, z.ZodNullable<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        open: string;
        close: string;
    }, {
        open: string;
        close: string;
    }>>>;
    pricePerSlot: z.ZodNumber;
    currency: z.ZodDefault<z.ZodLiteral<"SAR">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    deletedAt: z.ZodOptional<z.ZodDate>;
    totalBookings: z.ZodDefault<z.ZodNumber>;
    rating: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "_id" | "isActive" | "createdAt" | "updatedAt" | "ownerId" | "deletedAt" | "totalBookings" | "rating">, "strip", z.ZodTypeAny, {
    name: string;
    tags: string[];
    phone: string;
    location: {
        type: "Point";
        coordinates: [number, number];
    };
    sports: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[];
    images: string[];
    address: string;
    slotDurationMinutes: number;
    operatingHours: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", {
        open: string;
        close: string;
    } | null>>;
    pricePerSlot: number;
    currency: "SAR";
    description?: string | undefined;
}, {
    name: string;
    phone: string;
    location: {
        type: "Point";
        coordinates: [number, number];
    };
    sports: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[];
    images: string[];
    address: string;
    slotDurationMinutes: number;
    operatingHours: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", {
        open: string;
        close: string;
    } | null>>;
    pricePerSlot: number;
    description?: string | undefined;
    tags?: string[] | undefined;
    currency?: "SAR" | undefined;
}>;
export declare const UpdateFacilityDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    phone: z.ZodOptional<z.ZodString>;
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
    sports: z.ZodOptional<z.ZodArray<z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>, "many">>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    address: z.ZodOptional<z.ZodString>;
    slotDurationMinutes: z.ZodOptional<z.ZodNumber>;
    operatingHours: z.ZodOptional<z.ZodRecord<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, z.ZodNullable<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        open: string;
        close: string;
    }, {
        open: string;
        close: string;
    }>>>>;
    pricePerSlot: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodLiteral<"SAR">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    phone?: string | undefined;
    location?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    sports?: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[] | undefined;
    images?: string[] | undefined;
    address?: string | undefined;
    slotDurationMinutes?: number | undefined;
    operatingHours?: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", {
        open: string;
        close: string;
    } | null>> | undefined;
    pricePerSlot?: number | undefined;
    currency?: "SAR" | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    phone?: string | undefined;
    location?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    sports?: ("football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming")[] | undefined;
    images?: string[] | undefined;
    address?: string | undefined;
    slotDurationMinutes?: number | undefined;
    operatingHours?: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", {
        open: string;
        close: string;
    } | null>> | undefined;
    pricePerSlot?: number | undefined;
    currency?: "SAR" | undefined;
}>;
export declare const FacilitySearchDto: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    sport: z.ZodOptional<z.ZodEnum<["football", "basketball", "tennis", "volleyball", "padel", "squash", "badminton", "swimming"]>>;
    longitude: z.ZodOptional<z.ZodNumber>;
    latitude: z.ZodOptional<z.ZodNumber>;
    radiusKm: z.ZodDefault<z.ZodNumber>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["nearest", "popular", "rating", "price_asc", "price_desc"]>>;
}, "strip", z.ZodTypeAny, {
    radiusKm: number;
    page: number;
    limit: number;
    sortBy: "rating" | "nearest" | "popular" | "price_asc" | "price_desc";
    query?: string | undefined;
    longitude?: number | undefined;
    latitude?: number | undefined;
    sport?: "football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming" | undefined;
}, {
    query?: string | undefined;
    longitude?: number | undefined;
    latitude?: number | undefined;
    sport?: "football" | "basketball" | "tennis" | "volleyball" | "padel" | "squash" | "badminton" | "swimming" | undefined;
    radiusKm?: number | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "rating" | "nearest" | "popular" | "price_asc" | "price_desc" | undefined;
}>;
export type Facility = z.infer<typeof FacilitySchema>;
export type CreateFacilityDtoType = z.infer<typeof CreateFacilityDto>;
export type UpdateFacilityDtoType = z.infer<typeof UpdateFacilityDto>;
export type FacilitySearchDtoType = z.infer<typeof FacilitySearchDto>;
//# sourceMappingURL=facility.schema.d.ts.map