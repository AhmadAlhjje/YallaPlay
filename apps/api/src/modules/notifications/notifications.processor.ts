import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// All notification types dispatched from other services land here.
// Centralizing in a Bull processor decouples notification logic from
// business logic and prevents blocking the main request thread.
@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('booking_confirmed')
  async onBookingConfirmed(job: Job) {
    const { userId, facilityName, date, startTime } = job.data;
    await this.notificationsService.sendPush({
      userId,
      type: 'booking_confirmed',
      title: '✅ تم تأكيد حجزك',
      body: `حجزك في ${facilityName} بتاريخ ${date} الساعة ${startTime} مؤكد.`,
      data: { bookingId: job.data.bookingId, screen: 'BookingDetail' },
    });
  }

  @Process('booking_reminder')
  async onBookingReminder(job: Job) {
    const { userId, facilityName, date, startTime } = job.data;
    await this.notificationsService.sendPush({
      userId,
      type: 'booking_reminder',
      title: '⏰ تذكير بحجزك',
      body: `لديك حجز في ${facilityName} بعد ساعتين — ${date} الساعة ${startTime}`,
      data: { bookingId: job.data.bookingId, screen: 'BookingDetail' },
    });
  }

  @Process('booking_cancelled_by_owner')
  async onCancelledByOwner(job: Job) {
    const { userId, facilityName, date, startTime } = job.data;
    await this.notificationsService.sendPush({
      userId,
      type: 'booking_cancelled',
      title: '❌ تم إلغاء حجزك',
      body: `تم إلغاء حجزك في ${facilityName} بتاريخ ${date} الساعة ${startTime} من قبل صاحب الملعب.`,
      data: { bookingId: job.data.bookingId, screen: 'BookingDetail' },
    });
  }

  @Process('booking_cancelled_by_user')
  async onCancelledByUser(job: Job) {
    const { ownerId, date, startTime } = job.data;
    await this.notificationsService.sendPush({
      userId: ownerId,
      type: 'booking_cancelled',
      title: '❌ إلغاء حجز',
      body: `تم إلغاء الحجز بتاريخ ${date} الساعة ${startTime}.`,
      data: { bookingId: job.data.bookingId, screen: 'OwnerBookings' },
    });
  }

  @Process('new_booking')
  async onNewBooking(job: Job) {
    const { ownerId, facilityName, date, startTime, userName } = job.data;
    await this.notificationsService.sendPush({
      userId: ownerId,
      type: 'new_booking',
      title: '📋 حجز جديد',
      body: `طلب ${userName} حجزاً في ${facilityName} بتاريخ ${date} الساعة ${startTime}. راجع الحجز وأكّده.`,
      data: { bookingId: job.data.bookingId, screen: 'OwnerBookings' },
    });
  }

  @Process('payment_submitted')
  async onPaymentSubmitted(job: Job) {
    const { ownerId, facilityName, date, startTime, userName } = job.data;
    await this.notificationsService.sendPush({
      userId: ownerId,
      type: 'payment_submitted',
      title: '💳 تم إرسال الدفع',
      body: `تم إرسال دفع لحجز ${userName} في ${facilityName} بتاريخ ${date} الساعة ${startTime}.`,
      data: { bookingId: job.data.bookingId, screen: 'OwnerBookings' },
    });
  }

  @Process('waitlist_slot_available')
  async onWaitlistSlotAvailable(job: Job) {
    const { userId, facilityId, date, startTime, claimWindowMinutes } = job.data;
    await this.notificationsService.sendPush({
      userId,
      type: 'waitlist_available',
      title: '🟢 الوقت متاح الآن!',
      body: `أصبح وقت ${startTime} بتاريخ ${date} متاحاً. لديك ${claimWindowMinutes} دقيقة للحجز.`,
      data: { facilityId, date, startTime, screen: 'FacilityDetail' },
    });
  }

  @Process('points_earned')
  async onPointsEarned(job: Job) {
    const { userId, points, totalPoints } = job.data;
    await this.notificationsService.sendPush({
      userId,
      type: 'points_earned',
      title: '⭐ نقاط جديدة!',
      body: `ربحت ${points} نقاط. رصيدك الحالي: ${totalPoints} نقطة.`,
      data: { screen: 'Points' },
    });
  }
}
