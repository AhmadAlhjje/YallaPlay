import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../../database/schemas/user.mongoose-schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';
import { Facility, FacilitySchema } from '../../database/schemas/facility.mongoose-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Facility.name, schema: FacilitySchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
