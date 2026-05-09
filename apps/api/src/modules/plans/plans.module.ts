import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { PlansCron } from './plans.cron';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '../../database/schemas/subscription-plan.mongoose-schema';
import { User, UserSchema } from '../../database/schemas/user.mongoose-schema';
import { Facility, FacilitySchema } from '../../database/schemas/facility.mongoose-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: User.name, schema: UserSchema },
      { name: Facility.name, schema: FacilitySchema },
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [PlansController],
  providers: [PlansService, PlansCron],
  exports: [PlansService],
})
export class PlansModule {}
