import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Waitlist, WaitlistDocument } from '../../database/schemas/waitlist.mongoose-schema';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { JoinWaitlistDtoType } from '@yallaplay/shared-types';

const CLAIM_WINDOW_MINUTES = 30;

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    @InjectModel(Waitlist.name) private waitlistModel: Model<WaitlistDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async joinWaitlist(userId: string, dto: JoinWaitlistDtoType): Promise<WaitlistDocument> {
    // Confirm slot is actually booked (no point joining a free slot)
    const activeBooking = await this.bookingModel.findOne({
      facilityId: new Types.ObjectId(dto.facilityId),
      date: dto.date,
      startTime: dto.startTime,
      status: { $in: ['confirmed', 'pending_payment'] },
    }).lean();

    if (!activeBooking) {
      throw new BadRequestException('هذا الوقت متاح للحجز المباشر. لا حاجة لقائمة الانتظار.');
    }

    // Determine position (next in queue)
    const lastEntry = await this.waitlistModel
      .findOne({
        facilityId: new Types.ObjectId(dto.facilityId),
        date: dto.date,
        startTime: dto.startTime,
        status: 'waiting',
      })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const position = (lastEntry?.position ?? 0) + 1;

    try {
      const entry = await this.waitlistModel.create({
        facilityId: new Types.ObjectId(dto.facilityId),
        date: dto.date,
        startTime: dto.startTime,
        userId: new Types.ObjectId(userId),
        position,
        status: 'waiting',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      this.logger.log(`User ${userId} joined waitlist position ${position} for ${dto.facilityId} on ${dto.date} ${dto.startTime}`);
      return entry;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('أنت بالفعل في قائمة الانتظار لهذا الوقت.');
      }
      throw error;
    }
  }

  async leaveWaitlist(userId: string, waitlistId: string): Promise<void> {
    const entry = await this.waitlistModel.findById(waitlistId).lean();
    if (!entry) throw new NotFoundException('لم يتم العثور على طلب الانتظار.');
    if (entry.userId.toString() !== userId) {
      throw new BadRequestException('لا يمكنك إلغاء طلب الانتظار هذا.');
    }
    await this.waitlistModel.updateOne({ _id: waitlistId }, { status: 'expired' });
  }

  async getUserWaitlistEntries(userId: string): Promise<WaitlistDocument[]> {
    return this.waitlistModel
      .find({ userId: new Types.ObjectId(userId), status: 'waiting' })
      .populate('facilityId', 'name address')
      .sort({ createdAt: -1 })
      .lean() as unknown as WaitlistDocument[];
  }

  // Called by WaitlistProcessor when a slot is freed
  async processSlotFreed(facilityId: string, date: string, startTime: string): Promise<void> {
    const nextInQueue = await this.waitlistModel
      .findOne({
        facilityId: new Types.ObjectId(facilityId),
        date,
        startTime,
        status: 'waiting',
      })
      .sort({ position: 1 }) // position 1 = first in line
      .populate('userId', 'name')
      .lean();

    if (!nextInQueue) {
      this.logger.log(`No waitlist entries for slot ${facilityId} ${date} ${startTime}`);
      return;
    }

    // Mark as notified and set 30-min claim window
    await this.waitlistModel.updateOne(
      { _id: nextInQueue._id },
      {
        status: 'notified',
        notifiedAt: new Date(),
        expiresAt: new Date(Date.now() + CLAIM_WINDOW_MINUTES * 60 * 1000),
      },
    );

    // Notify the user — they have 30 min to book
    await this.notificationQueue.add('waitlist_slot_available', {
      userId: nextInQueue.userId.toString(),
      facilityId,
      date,
      startTime,
      claimWindowMinutes: CLAIM_WINDOW_MINUTES,
    });

    this.logger.log(`Waitlist: notified user ${nextInQueue.userId} for slot ${date} ${startTime}`);
  }

  // Called when user books a waitlisted slot — converts entry to 'converted'
  async markConverted(userId: string, facilityId: string, date: string, startTime: string): Promise<void> {
    await this.waitlistModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        facilityId: new Types.ObjectId(facilityId),
        date,
        startTime,
        status: 'notified',
      },
      { status: 'converted' },
    );
  }
}
