import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { Facility, FacilitySchema } from '../../database/schemas/facility.mongoose-schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Facility.name, schema: FacilitySchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
