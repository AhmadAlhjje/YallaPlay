import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../../database/schemas/user.mongoose-schema';
import { Facility, FacilitySchema } from '../../database/schemas/facility.mongoose-schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Facility.name, schema: FacilitySchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
