import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SportType, BookingStatus, PaymentMethod, PaymentStatus } from '@yallaplay/shared-types';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'Facility', required: true, index: true })
  facilityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: SportType, required: true })
  sport: string;

  // Stored as string "YYYY-MM-DD" — enables the compound unique slot key
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ type: String, enum: ['awaiting_payment', 'pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show'], default: 'awaiting_payment', index: true })
  status: string;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: string;

  @Prop({ type: String, enum: PaymentStatus, default: 'unpaid' })
  paymentStatus: string;

  @Prop()
  paymentSubmittedAt?: Date;

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice: number;

  @Prop({ type: Number, default: 0, min: 0 })
  discountApplied: number;

  // Signed JWT for QR code display — not in API responses
  @Prop({ select: false })
  qrToken?: string;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({ type: Number, default: 0, min: 0 })
  pointsEarned: number;

  @Prop({ type: Boolean, default: false })
  reminderSent: boolean;

  @Prop({ type: Boolean, default: false })
  sharedViaWhatsapp: boolean;

  @Prop({ type: String })
  paymentScreenshot?: string;

  // Walk-in / owner-added bookings
  @Prop({ type: String })
  guestName?: string;

  @Prop({ type: String })
  guestPhone?: string;

  @Prop({ type: Number, default: 0 })
  depositPaid?: number;

  // 'app' = booked by athlete via app, 'owner' = added manually by owner
  @Prop({ type: String, enum: ['app', 'owner'], default: 'app' })
  source?: string;

  // TTL: MongoDB auto-deletes abandoned pending_payment bookings after 15 min
  @Prop()
  expiresAt?: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// THE CONCURRENCY LOCK — compound unique index with partial filter
// Only one ACTIVE booking per slot can exist. Cancelled = slot released.
BookingSchema.index(
  { facilityId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled'] } },
    name: 'slot_unique_lock',
  },
);

// TTL index — auto-expire abandoned bookings
BookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'booking_ttl' });

// Query optimization indexes
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ facilityId: 1, date: 1, status: 1 });
BookingSchema.index({ status: 1, reminderSent: 1 }); // for reminder cron job
