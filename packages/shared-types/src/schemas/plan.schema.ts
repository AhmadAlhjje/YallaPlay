import { z } from 'zod';
import { PlanTier, BillingCycle } from '../enums';

export const PlanFeaturesSchema = z.object({
  maxFacilities: z.number().int().positive(),
  canAddOffers: z.boolean(),
  canSetCustomSlotPricing: z.boolean(),
  analyticsDepth: z.enum(['basic', 'full']),
  prioritySupport: z.boolean(),
  pointsMultiplier: z.number().positive().default(1),
  waitlistAccess: z.boolean(),
  customBranding: z.boolean(),
});

export const SubscriptionPlanSchema = z.object({
  _id: z.string(),
  name: z.enum(PlanTier),
  displayName: z.string(),
  price: z.number().min(0),
  billingCycle: z.enum(BillingCycle),
  features: PlanFeaturesSchema,
  isVisible: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreatePlanDto = SubscriptionPlanSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;
export type CreatePlanDtoType = z.infer<typeof CreatePlanDto>;
