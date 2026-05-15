import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
      status: { $in: ['confirmed', 'pending_payment', 'awaiting_payment'] },
    }).lean();

    if (userConflict) {
      throw new ConflictException('لديك حجز آخر في نفس الوقت.');
    }

    // 6. Calculate price (check for active offer)
    const price = await this.resolvePrice(dto.facilityId, dto.date, dto.startTime, facility.pricePerSlot);

    // 7. ATOMIC INSERT — MongoDB unique index fires here if slot is taken
    // Two simultaneous requests: only ONE succeeds. The other gets E11000 → 409.
    let booking: BookingDocument;
    try {
      booking = await this.bookingModel.create({
        facilityId: new Types.ObjectId(dto.facilityId),
        userId: new Types.ObjectId(userId),
        sport: dto.sport,
        date: dto.date,
        startTime: dto.startTime,
        endTime,
        status: 'awaiting_payment',
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'unpaid',
        totalPrice: price.final,
        discountApplied: price.discount,
        pointsEarned: 0,
        expiresAt: new Date(Date.now() + PENDING_PAYMENT_TTL_MS),
      });
    } catch (error: any) {
      // E11000 = MongoDB duplicate key — slot was taken between check and insert
      if (error?.code === 11000) {
        throw new ConflictException('هذا الوقت محجوز. اختر وقتاً آخر.');
      }
      throw error;
    }

    // 8. Generate QR token (signed JWT, 15 min expiry)
    const qrToken = await this.signQrToken(booking);
    await this.bookingModel.updateOne({ _id: booking._id }, { qrToken });

    // 9. Notify owner about the new booking request (fire-and-forget)
    this.userModel.findById(userId).select('name').lean().then((athlete) => {
      const athleteName = (athlete as any)?.name ?? 'لاعب';
      this.notificationQueue.add('new_booking', {
        ownerId: facility.ownerId.toString(),
        bookingId: booking._id.toString(),
        facilityName: facility.name,
        date: dto.date,
        startTime: dto.startTime,
        userName: athleteName,
      }).catch((err) => this.logger.warn(`notification queue error: ${err?.message}`));
    }).catch((err) => this.logger.warn(`user fetch error: ${err?.message}`));

    this.logger.log(`Booking created: ${booking._id} | User: ${userId} | Facility: ${dto.facilityId}`);

    return this.bookingModel.findById(booking._id).populate('facilityId', 'name address phone images shamCashQr').lean() as unknown as BookingDocument;
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

    const updated = await this.finalizeConfirmation(payload.bookingId, booking, facility);
    this.logger.log(`Booking confirmed: ${payload.bookingId}`);
    return updated;
  }

  // ─── Athlete: Mark payment submitted ─────────────────────────────────────

  async markPaymentSubmitted(bookingId: string, userId: string, screenshot?: string): Promise<void> {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('facilityId')
      .lean();
    if (!booking) throw new NotFoundException('الحجز غير موجود.');

    const facility = booking.facilityId as unknown as FacilityDocument;
    if (booking.userId.toString() !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لهذا الحجز.');
    }

    if (!['awaiting_payment', 'pending_payment'].includes(booking.status)) {
      throw new BadRequestException('لا يمكن إرسال الدفع لهذا الحجز.');
    }

    const updateData: Record<string, any> = {
      status: 'pending_payment',
      paymentSubmittedAt: new Date(),
    };
    if (screenshot) updateData['paymentScreenshot'] = screenshot;

    await this.bookingModel.updateOne(
      { _id: bookingId },
      { $set: updateData, $unset: { expiresAt: '' } },
    );

    // Fire-and-forget: don't block the response on queue availability
    this.userModel.findById(userId).select('name phone').lean().then((user) => {
      this.notificationQueue.add('payment_submitted', {
        ownerId: facility.ownerId.toString(),
        bookingId,
        facilityName: facility.name,
        date: booking.date,
        startTime: booking.startTime,
        userName: (user as any)?.name ?? 'لاعب',
        userPhone: (user as any)?.phone ?? '—',
      }).catch((err) => this.logger.warn(`notification queue error: ${err?.message}`));
    }).catch((err) => this.logger.warn(`user fetch error: ${err?.message}`));
  }

  // ─── Owner: Manual confirm ───────────────────────────────────────────────

  async confirmBookingManual(bookingId: string, ownerId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('facilityId')
      .lean();
    if (!booking) throw new NotFoundException('الحجز غير موجود.');

    const facility = booking.facilityId as unknown as FacilityDocument;
    if (facility.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('ليس لديك صلاحية لتأكيد هذا الحجز.');
    }

    if (booking.status !== 'pending_payment') {
      throw new BadRequestException('لا يمكن تأكيد هذا الحجز.');
    }

    const updated = await this.finalizeConfirmation(bookingId, booking, facility);
    this.logger.log(`Booking confirmed manually: ${bookingId}`);
    return updated;
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
    const isOwner = requesterRole === 'owner' && facility?.ownerId?.toString() === requesterId;
    const isUser = booking.userId?.toString() === requesterId;

    if (!isOwner && !isUser) {
      throw new ForbiddenException('ليس لديك صلاحية لإلغاء هذا الحجز.');
    }

    if (!['confirmed', 'pending_payment', 'awaiting_payment'].includes(booking.status)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الحجز.');
    }

    // Confirmed bookings: cannot cancel within 2 hours of start time
    if (booking.status === 'confirmed') {
      const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
      const diffMs = bookingStart.getTime() - Date.now();
      if (diffMs < 2 * 60 * 60 * 1000) {
        throw new BadRequestException('لا يمكن إلغاء الحجز قبل أقل من ساعتين من موعده.');
      }
    }

    await this.bookingModel.updateOne(
      { _id: bookingId },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
      },
    );

    // Revoke points — confirmed bookings keep 1 consolation point
    if (booking.pointsEarned > 0) {
      const pointsToRevoke = booking.status === 'confirmed'
        ? Math.max(0, booking.pointsEarned - 1)
        : booking.pointsEarned;
      if (pointsToRevoke > 0) {
        await this.userModel.updateOne(
          { _id: booking.userId },
          { $inc: { points: -pointsToRevoke } },
        );
      }
    }

    // Fire-and-forget notifications
    const notifyPayload = isOwner
      ? { event: 'booking_cancelled_by_owner', data: { userId: booking.userId.toString(), bookingId, facilityName: facility.name, date: booking.date, startTime: booking.startTime } }
      : { event: 'booking_cancelled_by_user', data: { ownerId: facility.ownerId.toString(), bookingId, date: booking.date, startTime: booking.startTime } };

    this.notificationQueue.add(notifyPayload.event, notifyPayload.data)
      .catch((err) => this.logger.warn(`notification queue error: ${err?.message}`));

    this.waitlistQueue.add('slot_freed', {
      facilityId: booking.facilityId.toString(),
      date: booking.date,
      startTime: booking.startTime,
    }).catch((err) => this.logger.warn(`waitlist queue error: ${err?.message}`));

    return this.bookingModel.findById(bookingId).lean() as unknown as BookingDocument;
  }

  // ─── Get single booking (owner or user) ───────────────────────────────────

  async findOne(bookingId: string, requesterId: string, requesterRole: string): Promise<BookingDocument> {
    const raw = await this.bookingModel
      .findById(bookingId)
      .select('+qrToken')
      .populate('facilityId', 'name address phone location images shamCashQr ownerId')
      .populate('userId', 'name phone avatar')
      .lean();

    if (!raw) throw new NotFoundException('الحجز غير موجود.');

    const facility = raw.facilityId as unknown as FacilityDocument;
    const isOwner = requesterRole === 'owner' && facility?.ownerId?.toString() === requesterId;
    const isUser = raw.userId?.toString() === requesterId || (raw as any).userId?._id?.toString() === requesterId;
    const isAdmin = requesterRole === 'admin';

    if (!isOwner && !isUser && !isAdmin) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الحجز.');
    }

    // Rename populated userId → user for frontend compatibility
    const { userId, ...rest } = raw as any;
    const booking = { ...rest, user: userId };

    return booking as unknown as BookingDocument;
  }

  // ─── Owner: list facility bookings ────────────────────────────────────────

  async findByFacility(
    facilityId: string,
    ownerId: string,
    date?: string,
    status?: string,
    page = 1,
    limit = 30,
  ) {
    await this.facilitiesService.findOneAndAssertOwner(facilityId, ownerId);

    const filter: Record<string, unknown> = {
      facilityId: new Types.ObjectId(facilityId),
    };
    if (date) filter['date'] = date;
    if (status) filter['status'] = status;

    const skip = (page - 1) * limit;
    const [rawBookings, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('userId', 'name phone avatar')
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookingModel.countDocuments(filter),
    ]);

    // Rename populated `userId` → `user` for frontend compatibility
    const bookings = rawBookings.map((b: any) => {
      const { userId, ...rest } = b;
      return { ...rest, user: userId };
    });

    return {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Owner: Add manual (walk-in) booking ─────────────────────────────────

  async ownerAddBooking(
    ownerId: string,
    dto: {
      facilityId: string;
      date: string;
      startTime: string;
      sport?: string;
      guestName: string;
      guestPhone?: string;
      depositPaid?: number;
      notes?: string;
    },
  ): Promise<BookingDocument> {
    const facility = await this.facilitiesService.findOneAndAssertOwner(dto.facilityId, ownerId);

    const today = new Date().toISOString().split('T')[0];
    if (dto.date < today) throw new BadRequestException('لا يمكن الحجز في تاريخ سابق.');

    const sport = dto.sport ?? facility.sports[0];
    if (!facility.sports.includes(sport)) {
      throw new BadRequestException(`الملعب لا يوفر هذه الرياضة.`);
    }

    const endTime = this.calculateEndTime(dto.startTime, facility.slotDurationMinutes);
    const price = await this.resolvePrice(dto.facilityId, dto.date, dto.startTime, facility.pricePerSlot);

    try {
      const booking = await this.bookingModel.create({
        facilityId: new Types.ObjectId(dto.facilityId),
        userId: new Types.ObjectId(ownerId),
        sport,
        date: dto.date,
        startTime: dto.startTime,
        endTime,
        status: 'confirmed',
        paymentMethod: 'qr_cash',
        paymentStatus: 'paid',
        totalPrice: price.final,
        discountApplied: 0,
        confirmedAt: new Date(),
        guestName: dto.guestName,
        guestPhone: dto.guestPhone ?? null,
        depositPaid: dto.depositPaid ?? 0,
        source: 'owner',
      });

      await this.facilitiesService.incrementBookingCount(dto.facilityId);
      this.logger.log(`Owner walk-in booking: ${booking._id} | Owner: ${ownerId}`);
      return booking;
    } catch (error: any) {
      if (error?.code === 11000) throw new ConflictException('هذا الوقت محجوز بالفعل. اختر وقتاً آخر.');
      throw error;
    }
  }

  // ─── Track WhatsApp share ──────────────────────────────────────────────────

  async markSharedViaWhatsapp(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingModel.findById(bookingId).lean();
    if (!booking || booking.userId?.toString() !== userId) {
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

  private async finalizeConfirmation(
    bookingId: string,
    booking: BookingDocument,
    facility: FacilityDocument,
  ): Promise<BookingDocument> {
    const updated = await this.bookingModel.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          status: 'confirmed',
          paymentStatus: 'paid',
          confirmedAt: new Date(),
          pointsEarned: POINTS_PER_BOOKING,
          expiresAt: undefined,
        },
      },
      { new: true },
    );

    await this.userModel.updateOne(
      { _id: booking.userId },
      { $inc: { points: POINTS_PER_BOOKING } },
    );

    await this.facilitiesService.incrementBookingCount(facility._id.toString());

    this.notificationQueue.add('booking_confirmed', {
      userId: booking.userId.toString(),
      bookingId,
      facilityName: facility.name,
      date: booking.date,
      startTime: booking.startTime,
    }).catch((err) => this.logger.warn(`notification queue error: ${err?.message}`));

    return updated as BookingDocument;
  }
}
