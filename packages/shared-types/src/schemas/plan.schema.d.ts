import { z } from 'zod';
export declare const PlanFeaturesSchema: z.ZodObject<{
    maxFacilities: z.ZodNumber;
    canAddOffers: z.ZodBoolean;
    canSetCustomSlotPricing: z.ZodBoolean;
    analyticsDepth: z.ZodEnum<["basic", "full"]>;
    prioritySupport: z.ZodBoolean;
    pointsMultiplier: z.ZodDefault<z.ZodNumber>;
    waitlistAccess: z.ZodBoolean;
    customBranding: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    maxFacilities: number;
    canAddOffers: boolean;
    canSetCustomSlotPricing: boolean;
    analyticsDepth: "basic" | "full";
    prioritySupport: boolean;
    pointsMultiplier: number;
    waitlistAccess: boolean;
    customBranding: boolean;
}, {
    maxFacilities: number;
    canAddOffers: boolean;
    canSetCustomSlotPricing: boolean;
    analyticsDepth: "basic" | "full";
    prioritySupport: boolean;
    waitlistAccess: boolean;
    customBranding: boolean;
    pointsMultiplier?: number | undefined;
}>;
export declare const SubscriptionPlanSchema: z.ZodObject<{
    _id: z.ZodString;
    name: z.ZodEnum<["free", "primer", "pro", "custom"]>;
    displayName: z.ZodString;
    price: z.ZodNumber;
    billingCycle: z.ZodEnum<["monthly", "yearly"]>;
    features: z.ZodObject<{
        maxFacilities: z.ZodNumber;
        canAddOffers: z.ZodBoolean;
        canSetCustomSlotPricing: z.ZodBoolean;
        analyticsDepth: z.ZodEnum<["basic", "full"]>;
        prioritySupport: z.ZodBoolean;
        pointsMultiplier: z.ZodDefault<z.ZodNumber>;
        waitlistAccess: z.ZodBoolean;
        customBranding: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        pointsMultiplier: number;
        waitlistAccess: boolean;
        customBranding: boolean;
    }, {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        waitlistAccess: boolean;
        customBranding: boolean;
        pointsMultiplier?: number | undefined;
    }>;
    isVisible: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: "pro" | "free" | "primer" | "custom";
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    price: number;
    displayName: string;
    billingCycle: "monthly" | "yearly";
    features: {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        pointsMultiplier: number;
        waitlistAccess: boolean;
        customBranding: boolean;
    };
    isVisible: boolean;
}, {
    name: "pro" | "free" | "primer" | "custom";
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    price: number;
    displayName: string;
    billingCycle: "monthly" | "yearly";
    features: {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        waitlistAccess: boolean;
        customBranding: boolean;
        pointsMultiplier?: number | undefined;
    };
    isVisible?: boolean | undefined;
}>;
export declare const CreatePlanDto: z.ZodObject<Omit<{
    _id: z.ZodString;
    name: z.ZodEnum<["free", "primer", "pro", "custom"]>;
    displayName: z.ZodString;
    price: z.ZodNumber;
    billingCycle: z.ZodEnum<["monthly", "yearly"]>;
    features: z.ZodObject<{
        maxFacilities: z.ZodNumber;
        canAddOffers: z.ZodBoolean;
        canSetCustomSlotPricing: z.ZodBoolean;
        analyticsDepth: z.ZodEnum<["basic", "full"]>;
        prioritySupport: z.ZodBoolean;
        pointsMultiplier: z.ZodDefault<z.ZodNumber>;
        waitlistAccess: z.ZodBoolean;
        customBranding: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        pointsMultiplier: number;
        waitlistAccess: boolean;
        customBranding: boolean;
    }, {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        waitlistAccess: boolean;
        customBranding: boolean;
        pointsMultiplier?: number | undefined;
    }>;
    isVisible: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "_id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    name: "pro" | "free" | "primer" | "custom";
    price: number;
    displayName: string;
    billingCycle: "monthly" | "yearly";
    features: {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        pointsMultiplier: number;
        waitlistAccess: boolean;
        customBranding: boolean;
    };
    isVisible: boolean;
}, {
    name: "pro" | "free" | "primer" | "custom";
    price: number;
    displayName: string;
    billingCycle: "monthly" | "yearly";
    features: {
        maxFacilities: number;
        canAddOffers: boolean;
        canSetCustomSlotPricing: boolean;
        analyticsDepth: "basic" | "full";
        prioritySupport: boolean;
        waitlistAccess: boolean;
        customBranding: boolean;
        pointsMultiplier?: number | undefined;
    };
    isVisible?: boolean | undefined;
}>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;
export type CreatePlanDtoType = z.infer<typeof CreatePlanDto>;
//# sourceMappingURL=plan.schema.d.ts.map