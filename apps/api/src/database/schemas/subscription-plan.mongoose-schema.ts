import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PlanTier, BillingCycle } from '@yallaplay/shared-types';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({ timestamps: true, collection: 'subscription_plans' })
export class SubscriptionPlan {
  @Prop({ type: String, enum: PlanTier, required: true, unique: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: String, enum: BillingCycle, required: true })
  billingCycle: string;

  @Prop({ type: Object, required: true })
  features: {
    maxFacilities: number;
    canAddOffers: boolean;
    canSetCustomSlotPricing: boolean;
    analyticsDepth: 'basic' | 'full';
    prioritySupport: boolean;
    pointsMultiplier: number;
    waitlistAccess: boolean;
    customBranding: boolean;
  };

  // Custom plans are not shown in public plan listings
  @Prop({ type: Boolean, default: true })
  isVisible: boolean;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
