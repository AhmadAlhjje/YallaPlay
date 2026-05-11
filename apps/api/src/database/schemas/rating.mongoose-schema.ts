import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true, collection: 'ratings' })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Facility', required: true })
  facilityId: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  value: number;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

// One rating per user per facility — upsert on repeat
RatingSchema.index({ userId: 1, facilityId: 1 }, { unique: true });
