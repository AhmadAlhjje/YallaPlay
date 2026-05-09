import { z } from 'zod';
import { NotificationType } from '../enums';

export const NotificationSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  type: z.enum(NotificationType),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).default({}),
  isRead: z.boolean().default(false),
  sentAt: z.date(),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof NotificationSchema>;
