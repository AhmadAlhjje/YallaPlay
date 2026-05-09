import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { User, UserSchema } from './schemas/user.mongoose-schema';
import { Facility, FacilitySchema } from './schemas/facility.mongoose-schema';
import { Booking, BookingSchema } from './schemas/booking.mongoose-schema';
import { Waitlist, WaitlistSchema } from './schemas/waitlist.mongoose-schema';
import { Notification, NotificationSchema } from './schemas/notification.mongoose-schema';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from './schemas/subscription-plan.mongoose-schema';

export const DB_SCHEMAS = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Facility.name, schema: FacilitySchema },
  { name: Booking.name, schema: BookingSchema },
  { name: Waitlist.name, schema: WaitlistSchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
]);

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        // Mongoose 8 uses native driver options
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
