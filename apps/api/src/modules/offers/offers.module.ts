import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer, OfferSchema } from '../../database/schemas/offer.mongoose-schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';
import { FacilitiesModule } from '../facilities/facilities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    FacilitiesModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
