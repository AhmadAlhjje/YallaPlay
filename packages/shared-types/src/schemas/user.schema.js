"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLocationDto = exports.UpdateUserDto = exports.CreateUserDto = exports.UserSchema = exports.GeoPointSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.GeoPointSchema = zod_1.z.object({
    type: zod_1.z.literal('Point'),
    coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]), // [longitude, latitude]
});
exports.UserSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    role: zod_1.z.enum(enums_1.UserRole),
    name: zod_1.z.string().min(2).max(100),
    phone: zod_1.z.string().regex(/^\+966\d{9}$/, 'يجب أن يبدأ الرقم بـ +966'),
    email: zod_1.z.string().email().optional(),
    avatar: zod_1.z.string().url().optional(),
    skillLevel: zod_1.z.enum(enums_1.SkillLevel).default('beginner'),
    preferredSports: zod_1.z.array(zod_1.z.enum(enums_1.SportType)).default([]),
    location: exports.GeoPointSchema.optional(),
    points: zod_1.z.number().int().min(0).default(0),
    plan: zod_1.z.enum(enums_1.PlanTier).default('free'),
    planExpiresAt: zod_1.z.date().optional(),
    isActive: zod_1.z.boolean().default(true),
    deviceTokens: zod_1.z.array(zod_1.z.string()).default([]),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateUserDto = exports.UserSchema.pick({
    name: true,
    phone: true,
    email: true,
    role: true,
}).partial({ email: true, role: true });
exports.UpdateUserDto = exports.UserSchema.pick({
    name: true,
    email: true,
    avatar: true,
    skillLevel: true,
    preferredSports: true,
    location: true,
}).partial();
exports.UpdateLocationDto = zod_1.z.object({
    longitude: zod_1.z.number().min(-180).max(180),
    latitude: zod_1.z.number().min(-90).max(90),
});
//# sourceMappingURL=user.schema.js.map