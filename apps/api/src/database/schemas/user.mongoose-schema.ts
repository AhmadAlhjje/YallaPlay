import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
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

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  location?: { type: string; coordinates: [number, number] } | null;

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

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Facility' }], default: [] })
  favorites: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isPhoneVerified: boolean;

  // Password auth
  @Prop({ select: false })
  passwordHash?: string;

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

// Sparse so users without location are excluded from the index
UserSchema.index({ location: '2dsphere' }, { sparse: true });
UserSchema.index({ role: 1, isActive: 1 });

// Never return sensitive fields in normal queries
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.otpHash;
    delete ret.otpExpiresAt;
    delete ret.refreshTokenHash;
    return ret;
  },
});
