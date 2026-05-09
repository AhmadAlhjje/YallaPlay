import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

interface SlotFreedJob {
  facilityId: string;
  date: string;
  startTime: string;
}

// Bull processor — jobs run SEQUENTIALLY per queue by default.
// This prevents the waitlist race condition:
// Two simultaneous cancellations cannot both notify the same "next in queue" user.
@Processor('waitlist')
export class WaitlistProcessor {
  private readonly logger = new Logger(WaitlistProcessor.name);

  constructor(private readonly waitlistService: WaitlistService) {}

  @Process('slot_freed')
  async handleSlotFreed(job: Job<SlotFreedJob>): Promise<void> {
    const { facilityId, date, startTime } = job.data;
    this.logger.log(`Processing freed slot: ${facilityId} | ${date} ${startTime}`);

    try {
      await this.waitlistService.processSlotFreed(facilityId, date, startTime);
    } catch (error) {
      this.logger.error(`Waitlist processing failed for slot ${date} ${startTime}:`, error);
      throw error; // Bull will retry based on queue config
    }
  }
}
