"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilitySearchDto = exports.UpdateFacilityDto = exports.CreateFacilityDto = exports.FacilitySchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
const user_schema_1 = require("./user.schema");
const OperatingHoursDaySchema = zod_1.z
    .object({
    open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
    close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت: HH:mm'),
})
    .nullable();
exports.FacilitySchema = zod_1.z.object({
    _id: zod_1.z.string(),
    ownerId: zod_1.z.string(),
    name: zod_1.z.string().min(2).max(150),
    description: zod_1.z.string().max(1000).optional(),
    sports: zod_1.z.array(zod_1.z.enum(enums_1.SportType)).min(1),
    images: zod_1.z.array(zod_1.z.string().url()).min(1).max(10),
    location: user_schema_1.GeoPointSchema,
    address: zod_1.z.string().min(5).max(300),
    phone: zod_1.z.string(),
    slotDurationMinutes: zod_1.z.number().int().min(30).max(180),
    operatingHours: zod_1.z.record(zod_1.z.enum(enums_1.DayOfWeek), OperatingHoursDaySchema),
    pricePerSlot: zod_1.z.number().positive(),
    currency: zod_1.z.literal('SAR').default('SAR'),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isActive: zod_1.z.boolean().default(true),
    deletedAt: zod_1.z.date().optional(),
    totalBookings: zod_1.z.number().int().min(0).default(0),
    rating: zod_1.z.number().min(0).max(5).default(0),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateFacilityDto = exports.FacilitySchema.omit({
    _id: true,
    ownerId: true,
    isActive: true,
    deletedAt: true,
    totalBookings: true,
    rating: true,
    createdAt: true,
    updatedAt: true,
});
exports.UpdateFacilityDto = exports.CreateFacilityDto.partial();
exports.FacilitySearchDto = zod_1.z.object({
    query: zod_1.z.string().optional(),
    sport: zod_1.z.enum(enums_1.SportType).optional(),
    longitude: zod_1.z.number().optional(),
    latitude: zod_1.z.number().optional(),
    radiusKm: zod_1.z.number().positive().max(50).default(10),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(50).default(20),
    sortBy: zod_1.z.enum(['nearest', 'popular', 'rating', 'price_asc', 'price_desc']).default('popular'),
});
//# sourceMappingURL=facility.schema.js.map