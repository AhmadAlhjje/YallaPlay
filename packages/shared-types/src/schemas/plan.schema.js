"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePlanDto = exports.SubscriptionPlanSchema = exports.PlanFeaturesSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.PlanFeaturesSchema = zod_1.z.object({
    maxFacilities: zod_1.z.number().int().positive(),
    canAddOffers: zod_1.z.boolean(),
    canSetCustomSlotPricing: zod_1.z.boolean(),
    analyticsDepth: zod_1.z.enum(['basic', 'full']),
    prioritySupport: zod_1.z.boolean(),
    pointsMultiplier: zod_1.z.number().positive().default(1),
    waitlistAccess: zod_1.z.boolean(),
    customBranding: zod_1.z.boolean(),
});
exports.SubscriptionPlanSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    name: zod_1.z.enum(enums_1.PlanTier),
    displayName: zod_1.z.string(),
    price: zod_1.z.number().min(0),
    billingCycle: zod_1.z.enum(enums_1.BillingCycle),
    features: exports.PlanFeaturesSchema,
    isVisible: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreatePlanDto = exports.SubscriptionPlanSchema.omit({
    _id: true,
    createdAt: true,
    updatedAt: true,
});
//# sourceMappingURL=plan.schema.js.map