import { z } from 'zod';
import { WaitlistStatus } from '../enums';

export const WaitlistSchema = z.object({
  _id: z.string(),
  facilityId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  userId: z.string(),
  position: z.number().int().positive(),
  status: z.enum(WaitlistStatus).default('waiting'),
  notifiedAt: z.date().optional(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const JoinWaitlistDto = z.object({
  facilityId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export type Waitlist = z.infer<typeof WaitlistSchema>;
export type JoinWaitlistDtoType = z.infer<typeof JoinWaitlistDto>;
