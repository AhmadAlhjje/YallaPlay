import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true, collection: 'offers' })
export class Offer {
  @Prop({ type: Types.ObjectId, ref: 'Facility', required: true, index: true })
  facilityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) // owner
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ type: Number, required: true, min: 1, max: 100 })
  discountPercent: number;

  @Prop({ type: Number, required: true })
  originalPrice: number;

  @Prop({ type: Number, required: true })
  discountedPrice: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  // Auto-expire when the slot time passes
  @Prop({ required: true })
  expiresAt: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

OfferSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'offer_ttl' });
OfferSchema.index({ facilityId: 1, date: 1, startTime: 1, isActive: 1 });
