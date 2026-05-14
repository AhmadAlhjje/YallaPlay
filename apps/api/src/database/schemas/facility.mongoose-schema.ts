import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SportType, DayOfWeek } from '@yallaplay/shared-types';

export type FacilityDocument = Facility & Document;

@Schema({ timestamps: true, collection: 'facilities' })
export class Facility {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], enum: SportType, required: true })
  sports!: string[];

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: Object })
  location?: { type: 'Point'; coordinates: [number, number] };

  @Prop({ required: true })
  address!: string;

  @Prop()
  phone?: string;

  @Prop()
  shamCashQr?: string;

  @Prop({ type: Number, required: true, min: 30, max: 180 })
  slotDurationMinutes!: number;

  @Prop({ type: Object, required: true })
  operatingHours!: Record<string, { open: string; close: string } | null>;

  @Prop({ type: Number, required: true, min: 0 })
  pricePerSlot!: number;

  @Prop({
    type: [
      {
        label:   { type: String, enum: ['morning', 'evening'] },
        from:    String,
        to:      String,
        price:   Number,
        deposit: { type: Number, default: 0 },
      },
    ],
    default: undefined,
  })
  pricingSchedule?: { label: string; from: string; to: string; price: number; deposit?: number }[];

  @Prop({ type: String, default: 'SAR' })
  currency!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Number, default: 0 })
  totalBookings!: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  ratingCount!: number;
}

export const FacilitySchema = SchemaFactory.createForClass(Facility);

// Critical indexes
FacilitySchema.index({ location: '2dsphere' }, { sparse: true }); // sparse: skip docs without location
FacilitySchema.index({ sports: 1, isActive: 1 });
FacilitySchema.index({ totalBookings: -1 }); // for "popular" sort
FacilitySchema.index({ name: 'text', description: 'text' }); // full-text search
