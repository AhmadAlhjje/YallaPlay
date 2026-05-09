import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';
import { User, UserSchema } from '../../database/schemas/user.mongoose-schema';
import { Facility, FacilitySchema } from '../../database/schemas/facility.mongoose-schema';
import { FacilitiesModule } from '../facilities/facilities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: Facility.name, schema: FacilitySchema },
    ]),
    JwtModule.register({}),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'waitlist' },
    ),
    FacilitiesModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
