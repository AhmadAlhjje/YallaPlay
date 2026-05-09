import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from '@yallaplay/shared-types';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, unknown>;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop()
  sentAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// 90-day TTL — auto-clean old notifications
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7_776_000, name: 'notification_ttl_90d' },
);

NotificationSchema.index({ userId: 1, isRead: 1 });
