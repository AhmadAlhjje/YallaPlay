import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import {
  OwnerAnalyticsController,
  AdminAnalyticsController,
} from './analytics.controller';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';
import { Facility, FacilitySchema } from '../../database/schemas/facility.mongoose-schema';
import { User, UserSchema } from '../../database/schemas/user.mongoose-schema';
import { FacilitiesModule } from '../facilities/facilities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Facility.name, schema: FacilitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    FacilitiesModule,
  ],
  controllers: [OwnerAnalyticsController, AdminAnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
