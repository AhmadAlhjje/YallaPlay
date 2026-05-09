import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsCron } from './notifications.cron';
import {
  Notification,
  NotificationSchema,
} from '../../database/schemas/notification.mongoose-schema';
import { User, UserSchema } from '../../database/schemas/user.mongoose-schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';
import { Facility, FacilitySchema } from '../../database/schemas/facility.mongoose-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Facility.name, schema: FacilitySchema },
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor, NotificationsCron],
  exports: [NotificationsService],
})
export class NotificationsModule {}
