import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { Facility, FacilityDocument } from '../../database/schemas/facility.mongoose-schema';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  // Runs every 5 minutes
  // Finds confirmed bookings starting in ~2 hours and queues reminder notifications
  @Cron('*/5 * * * *')
  async sendBookingReminders(): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Target window: bookings starting between now+115min and now+120min
    const windowStart = new Date(now.getTime() + 115 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 120 * 60 * 1000);

    const toHHMM = (d: Date) =>
      `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    const startBound = toHHMM(windowStart);
    const endBound = toHHMM(windowEnd);

    const upcoming = await this.bookingModel
      .find({
        date: today,
        startTime: { $gte: startBound, $lte: endBound },
        status: 'confirmed',
        reminderSent: false,
      })
      .populate('facilityId', 'name')
      .lean();

    if (upcoming.length === 0) return;

    this.logger.log(`Reminder cron: ${upcoming.length} booking(s) to remind`);

    const jobs = upcoming.map((booking) => {
      const facility = booking.facilityId as unknown as FacilityDocument;
      return this.notificationQueue.add('booking_reminder', {
        userId: booking.userId.toString(),
        bookingId: booking._id.toString(),
        facilityName: facility?.name ?? 'الملعب',
        date: booking.date,
        startTime: booking.startTime,
      });
    });

    await Promise.all(jobs);

    // Mark reminders as sent to prevent duplicates
    const ids = upcoming.map((b) => b._id);
    await this.bookingModel.updateMany({ _id: { $in: ids } }, { reminderSent: true });
  }

  // Runs daily at midnight — marks past confirmed bookings as 'completed'
  @Cron('0 0 * * *')
  async markCompletedBookings(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const result = await this.bookingModel.updateMany(
      { date: { $lte: dateStr }, status: 'confirmed' },
      { $set: { status: 'completed' } },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`Marked ${result.modifiedCount} booking(s) as completed`);
    }
  }
}
