import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { WaitlistProcessor } from './waitlist.processor';
import { Waitlist, WaitlistSchema } from '../../database/schemas/waitlist.mongoose-schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.mongoose-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Waitlist.name, schema: WaitlistSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    BullModule.registerQueue(
      { name: 'waitlist' },
      { name: 'notifications' },
    ),
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService, WaitlistProcessor],
  exports: [WaitlistService],
})
export class WaitlistModule {}
