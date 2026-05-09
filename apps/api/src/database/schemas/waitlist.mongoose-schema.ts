import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WaitlistStatus } from '@yallaplay/shared-types';

export type WaitlistDocument = Waitlist & Document;

@Schema({ timestamps: true, collection: 'waitlists' })
export class Waitlist {
  @Prop({ type: Types.ObjectId, ref: 'Facility', required: true })
  facilityId: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  position: number;

  @Prop({ type: String, enum: WaitlistStatus, default: 'waiting', index: true })
  status: string;

  @Prop()
  notifiedAt?: Date;

  // User has 30 min to claim after notification — then slot goes to next in queue
  @Prop({ required: true })
  expiresAt: Date;
}

export const WaitlistSchema = SchemaFactory.createForClass(Waitlist);

// TTL auto-expire stale waitlist entries
WaitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'waitlist_ttl' });

// One user per slot in waitlist
WaitlistSchema.index(
  { facilityId: 1, date: 1, startTime: 1, userId: 1 },
  { unique: true, name: 'waitlist_user_slot_unique' },
);

WaitlistSchema.index({ facilityId: 1, date: 1, startTime: 1, position: 1 });
