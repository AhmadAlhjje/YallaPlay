import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { User, UserDocument } from '../../database/schemas/user.mongoose-schema';
import { Facility, FacilityDocument } from '../../database/schemas/facility.mongoose-schema';
import { FacilitiesService } from '../facilities/facilities.service';
import { CreateBookingDtoType, CancelBookingDtoType } from '@yallaplay/shared-types';

const POINTS_PER_BOOKING = 5;
const PENDING_PAYMENT_TTL_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private config: ConfigService,
    private facilitiesService: FacilitiesService,
    @InjectQueue('notifications') private notificationQueue: Queue,
    @InjectQueue('waitlist') private waitlistQueue: Queue,
  ) {}

  // ─── Create Booking ────────────────────────────────────────────────────────
  // This is the concurrency battleground. The MongoDB unique index is the lock.

  async createBooking(userId: string, dto: CreateBookingDtoType): Promise<BookingDocument> {
    // 1. Validate facility exists and is active
    const facility = await this.facilityModel.findOne({
      _id: dto.facilityId,
      isActive: true,
    }).lean();
    if (!facility) throw new NotFoundException('الملعب غير موجود.');

    // 2. Validate the sport is offered at this facility
    if (!facility.sports.includes(dto.sport)) {
      throw new BadRequestException(`هذا الملعب لا يوفر رياضة ${dto.sport}.`);
    }

    // 3. Validate date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (dto.date < today) {
      throw new BadRequestException('لا يمكن الحجز في تاريخ سابق.');
    }

    // 4. Calculate end time from slot duration
    const endTime = this.calculateEndTime(dto.startTime, facility.slotDurationMinutes);

    // 5. Check if user already has a booking at this exact time (different facility)
    const userConflict = await this.bookingModel.findOne({
      userId: new Types.ObjectId(userId),
      date: dto.date,
      startTime: dto.startTime,
      status: { $in: ['confirmed', 'pending_payment'] },
    }).lean();

    if (userConflict) {
      throw new ConflictException('لديك حجز آخر في نفس الوقت.');
    }

    // 6. Calculate price (check for active offer)
    const price = await this.resolvePrice(dto.facilityId, dto.date, dto.startTime, facility.pricePerSlot);

    // 7. ATOMIC INSERT — MongoDB unique index fires here if slot is taken
    // Two simultaneous requests: only ONE succeeds. The other gets E11000 → 409.
    const session = await this.connection.startSession();
    session.startTransaction();

    let booking: BookingDocument;
    try {
      const [created] = await this.bookingModel.create(
        [
          {
            facilityId: new Types.ObjectId(dto.facilityId),
            userId: new Types.ObjectId(userId),
            sport: dto.sport,
            date: dto.date,
            startTime: dto.startTime,
            endTime,
            status: 'pending_payment',
            paymentMethod: dto.paymentMethod,
            paymentStatus: 'unpaid',
            totalPrice: price.final,
            discountApplied: price.discount,
            pointsEarned: 0,
            expiresAt: new Date(Date.now() + PENDING_PAYMENT_TTL_MS),
          },
        ],
        { session },
      );

      await session.commitTransaction();
      booking = created;
    } catch (error: any) {
      await session.abortTransaction();
      // E11000 = MongoDB duplicate key — slot was taken between check and insert
      if (error?.code === 11000) {
        throw new ConflictException('هذا الوقت محجوز. اختر وقتاً آخر.');
      }
      throw error;
    } finally {
      session.endSession();
    }

    // 8. Generate QR token (signed JWT, 15 min expiry)
    const qrToken = await this.signQrToken(booking);
    await this.bookingModel.updateOne({ _id: booking._id }, { qrToken });

    this.logger.log(`Booking created: ${booking._id} | User: ${userId} | Facility: ${dto.facilityId}`);

    return this.bookingModel.findById(booking._id).populate('facilityId', 'name address phone images').lean() as unknown as BookingDocument;
  }

  // ─── Confirm Booking (Owner scans QR) ─────────────────────────────────────

  async confirmBooking(qrToken: string, ownerId: string): Promise<BookingDocument> {
    // 1. Verify QR token signature
    let payload: { bookingId: string; facilityId: string; userId: string; amount: number };
    try {
      payload = await this.jwtService.verifyAsync(qrToken, {
        secret: this.config.getOrThrow('JWT_QR_SECRET'),
      });
    } catch {
      throw new BadRequestException('رمز QR غير صالح أو منتهي الصلاحية.');
    }

    // 2. Fetch booking
    const booking = await this.bookingModel
      .findById(payload.bookingId)
      .populate('facilityId')
      .lean();
    if (!booking) throw new NotFoundException('الحجز غير موجود.');

    // 3. Assert confirming owner owns this facility
    const facility = booking.facilityId as unknown as FacilityDocument;
    if (facility.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('ليس لديك صلاحية لتأكيد هذا الحجز.');
    }

    // 4. Assert booking is still pending
    if (booking.status !== 'pending_payment') {
      throw new BadRequestException(
        booking.status === 'confirmed'
          ? 'الحجز مؤكد بالفعل.'
          : 'لا يمكن تأكيد هذا الحجز.',
      );
    }

    // 5. Atomic confirm + grant points in ONE update
    const updated = await this.bookingModel.findByIdAndUpdate(
      payload.bookingId,
      {
        $set: {
          status: 'confirmed',
          paymentStatus: 'paid',
          confirmedAt: new Date(),
          pointsEarned: POINTS_PER_BOOKING,
          expiresAt: undefined, // Remove TTL — confirmed bookings don't expire
        },
      },
      { new: true },
    );

    // 6. Grant points to user atomically
    await this.userModel.updateOne(
      { _id: booking.userId },
      { $inc: { points: POINTS_PER_BOOKING } },
    );

    // 7. Increment facility booking counter (denormalized for "popular" sort)
    await this.facilitiesService.incrementBookingCount(payload.facilityId);

    // 8. Queue confirmation notification to user
    await this.notificationQueue.add('booking_confirmed', {
      userId: booking.userId.toString(),
      bookingId: payload.bookingId,
      facilityName: facility.name,
      date: booking.date,
      startTime: booking.startTime,
    });

    this.logger.log(`Booking confirmed: ${payload.bookingId}`);
    return updated!;
  }

  // ─── Cancel Booking ────────────────────────────────────────────────────────

  async cancelBooking(
    bookingId: string,
    requesterId: string,
    requesterRole: string,
    dto: CancelBookingDtoType,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).populate('facilityId').lean();
    if (!booking) throw new NotFoundException('الحجز غير موجود.');

    const facility = booking.facilityId as unknown as FacilityDocument;
    const isOwner = requesterRole === 'owner' && facility.ownerId.toString() === requesterId;
    const isUser = booking.userId.toString() === requesterId;

    if (!isOwner && !isUser) {
      throw new ForbiddenException('ليس لديك صلاحية لإلغاء هذا الحجز.');
    }

    if (!['confirmed', 'pending_payment'].includes(booking.status)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الحجز.');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.bookingModel.updateOne(
        { _id: bookingId },
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: dto.reason,
          },
        },
        { session },
      );

      // Revoke points if they were granted
      if (booking.pointsEarned > 0) {
        await this.userModel.updateOne(
          { _id: booking.userId },
          { $inc: { points: -booking.pointsEarned } },
          { session },
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Notify the other party
    if (isOwner) {
      await this.notificationQueue.add('booking_cancelled_by_owner', {
        userId: booking.userId.toString(),
        bookingId,
        facilityName: facility.name,
        date: booking.date,
        startTime: booking.startTime,
      });
    } else {
      await this.notificationQueue.add('booking_cancelled_by_user', {
        ownerId: facility.ownerId.toString(),
        bookingId,
        date: booking.date,
        startTime: booking.startTime,
      });
    }

    // Trigger waitlist processing for this newly freed slot
    await this.waitlistQueue.add('slot_freed', {
      facilityId: booking.facilityId.toString(),
      date: booking.date,
      startTime: booking.startTime,
    });

    return this.bookingModel.findById(bookingId).lean() as unknown as BookingDocument;
  }

  // ─── Get single booking (owner or user) ───────────────────────────────────

  async findOne(bookingId: string, requesterId: string, requesterRole: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(bookingId)
      .select('+qrToken')
      .populate('facilityId', 'name address phone location images')
      .lean();

    if (!booking) throw new NotFoundException('الحجز غير موجود.');

    const facility = booking.facilityId as unknown as FacilityDocument;
    const isOwner = requesterRole === 'owner' && facility.ownerId.toString() === requesterId;
    const isUser = booking.userId.toString() === requesterId;
    const isAdmin = requesterRole === 'admin';

    if (!isOwner && !isUser && !isAdmin) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الحجز.');
    }

    return booking as unknown as BookingDocument;
  }

  // ─── Owner: list facility bookings ────────────────────────────────────────

  async findByFacility(
    facilityId: string,
    ownerId: string,
    date?: string,
    status?: string,
  ) {
    await this.facilitiesService.findOneAndAssertOwner(facilityId, ownerId);

    const filter: Record<string, unknown> = {
      facilityId: new Types.ObjectId(facilityId),
    };
    if (date) filter['date'] = date;
    if (status) filter['status'] = status;

    return this.bookingModel
      .find(filter)
      .populate('userId', 'name phone avatar')
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  // ─── Track WhatsApp share ──────────────────────────────────────────────────

  async markSharedViaWhatsapp(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingModel.findById(bookingId).lean();
    if (!booking || booking.userId.toString() !== userId) {
      throw new ForbiddenException();
    }
    await this.bookingModel.updateOne({ _id: bookingId }, { sharedViaWhatsapp: true });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const endM = (totalMinutes % 60).toString().padStart(2, '0');
    return `${endH}:${endM}`;
  }

  private async signQrToken(booking: BookingDocument): Promise<string> {
    return this.jwtService.signAsync(
      {
        bookingId: booking._id.toString(),
        facilityId: booking.facilityId.toString(),
        userId: booking.userId.toString(),
        amount: booking.totalPrice,
      },
      {
        secret: this.config.getOrThrow('JWT_QR_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private async resolvePrice(
    facilityId: string,
    date: string,
    startTime: string,
    basePrice: number,
  ): Promise<{ final: number; discount: number }> {
    // Offer resolution will be injected by OffersService in a later step
    // For now returns base price
    return { final: basePrice, discount: 0 };
  }
}
