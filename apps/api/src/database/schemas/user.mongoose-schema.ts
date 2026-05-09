import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SkillLevel, SportType, UserRole, PlanTier } from '@yallaplay/shared-types';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: String, enum: UserRole, required: true, default: 'athlete' })
  role: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop({ sparse: true })
  email?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: SkillLevel, default: 'beginner' })
  skillLevel: string;

  @Prop({ type: [String], enum: SportType, default: [] })
  preferredSports: string[];

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: { type: [Number] },
  })
  location?: { type: string; coordinates: [number, number] };

  @Prop({ type: Number, default: 0, min: 0 })
  points: number;

  @Prop({ type: String, enum: PlanTier, default: 'free' })
  plan: string;

  @Prop()
  planExpiresAt?: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  deviceTokens: string[];

  // OTP fields — not exposed in API responses
  @Prop({ select: false })
  otpHash?: string;

  @Prop({ select: false })
  otpExpiresAt?: Date;

  // Refresh token rotation
  @Prop({ select: false })
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Geospatial index for nearby facilities
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ role: 1, isActive: 1 });

// Never return sensitive fields in normal queries
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.otpHash;
    delete ret.otpExpiresAt;
    delete ret.refreshTokenHash;
    return ret;
  },
});
