import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PlansService } from './plans.service';

@Injectable()
export class PlansCron {
  private readonly logger = new Logger(PlansCron.name);

  constructor(
    private readonly plansService: PlansService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  // Runs daily at 01:00 — downgrades expired paid plans to free
  @Cron('0 1 * * *')
  async expirePlans(): Promise<void> {
    const count = await this.plansService.expireOverduePlans();
    if (count > 0) {
      this.logger.log(`Plan expiry: downgraded ${count} owner(s) to free plan`);
    }
  }
}
