import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Facility, FacilityDocument } from '../../database/schemas/facility.mongoose-schema';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { Rating, RatingDocument } from '../../database/schemas/rating.mongoose-schema';
import {
  CreateFacilityDtoType,
  UpdateFacilityDtoType,
  FacilitySearchDtoType,
  SlotDtoType,
  DayOfWeek,
} from '@yallaplay/shared-types';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  // ─── Owner CRUD ────────────────────────────────────────────────────────────

  async create(ownerId: string, dto: CreateFacilityDtoType): Promise<FacilityDocument> {
    const facility = await this.facilityModel.create({ ...dto, ownerId });
    return facility;
  }

  async update(
    facilityId: string,
    ownerId: string,
    dto: UpdateFacilityDtoType,
  ): Promise<FacilityDocument> {
    const facility = await this.findOneAndAssertOwner(facilityId, ownerId);
    Object.assign(facility, dto);
    return facility.save();
  }

  async softDelete(facilityId: string, ownerId: string): Promise<void> {
    const facility = await this.findOneAndAssertOwner(facilityId, ownerId);

    // Block delete if future confirmed bookings exist
    const futureBookings = await this.bookingModel.countDocuments({
      facilityId: new Types.ObjectId(facilityId),
      date: { $gte: new Date().toISOString().split('T')[0] },
      status: 'confirmed',
    });

    if (futureBookings > 0) {
      throw new BadRequestException(
        `لا يمكن حذف الملعب. يوجد ${futureBookings} حجز مؤكد قادم. يرجى إلغاء الحجوزات أولاً.`,
      );
    }

    await this.facilityModel.updateOne(
      { _id: facilityId },
      { isActive: false, deletedAt: new Date() },
    );
  }

  async findByOwner(ownerId: string): Promise<FacilityDocument[]> {
    let objectId: Types.ObjectId | null = null;
    try { objectId = new Types.ObjectId(ownerId); } catch { /* invalid hex */ }

    const query = objectId
      ? { $or: [{ ownerId: objectId }, { ownerId: ownerId }] }
      : { ownerId: ownerId };

    return this.facilityModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean() as unknown as FacilityDocument[];
  }

  // ─── Public Search ─────────────────────────────────────────────────────────

  async search(dto: FacilitySearchDtoType) {
    const filter: Record<string, unknown> = { isActive: true };
    const skip = (dto.page - 1) * dto.limit;

    // Text search
    if (dto.query) {
      filter['$text'] = { $search: dto.query };
    }

    // Sport filter
    if (dto.sport) {
      filter['sports'] = dto.sport;
    }

    // Featured filter
    if (dto.featured) {
      filter['tags'] = { $in: ['featured'] };
    }

    // Bookings date filter (facilities that have bookings on this date)
    if (dto.bookingsDate) {
      const facilityIds = await this.bookingModel.distinct('facilityId', {
        date: dto.bookingsDate,
        status: { $in: ['confirmed', 'pending_payment'] },
      });

      if (facilityIds.length === 0) {
        return {
          facilities: [],
          pagination: { page: dto.page, limit: dto.limit, total: 0, pages: 0 },
        };
      }

      filter['_id'] = { $in: facilityIds };
    }

    let queryBuilder = this.facilityModel.find(filter);

    // Geo filter — must have coordinates to use $near
    if (dto.longitude && dto.latitude) {
      queryBuilder = this.facilityModel.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
            $maxDistance: dto.radiusKm * 1000, // km → meters
          },
        },
      });
    }

    // Sorting
    switch (dto.sortBy) {
      case 'popular':
        queryBuilder = queryBuilder.sort({ totalBookings: -1 });
        break;
      case 'rating':
        queryBuilder = queryBuilder.sort({ rating: -1 });
        break;
      case 'price_asc':
        queryBuilder = queryBuilder.sort({ pricePerSlot: 1 });
        break;
      case 'price_desc':
        queryBuilder = queryBuilder.sort({ pricePerSlot: -1 });
        break;
      // 'nearest' is handled by $near which returns sorted by distance
    }

    const [facilities, total] = await Promise.all([
      queryBuilder.skip(skip).limit(dto.limit).lean(),
      this.facilityModel.countDocuments(filter),
    ]);

    return {
      facilities,
      pagination: { page: dto.page, limit: dto.limit, total, pages: Math.ceil(total / dto.limit) },
    };
  }

  async findById(facilityId: string): Promise<FacilityDocument> {
    const facility = await this.facilityModel
      .findOne({ _id: facilityId, isActive: true })
      .lean();
    if (!facility) throw new NotFoundException('الملعب غير موجود أو تم حذفه.');
    return facility as FacilityDocument;
  }

  // ─── Slot Generation — The Core Algorithm ─────────────────────────────────

  async getAvailableSlots(facilityId: string, date: string): Promise<SlotDtoType[]> {
    const facility = await this.findById(facilityId);
    const dayName = this.getDayName(date);
    const hours = facility.operatingHours[dayName];

    if (!hours) {
      return []; // Facility closed on this day
    }

    // Validate date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      throw new BadRequestException('لا يمكن الحجز في تاريخ سابق.');
    }

    // Generate all possible slot times for this day
    const allSlots = this.generateTimeSlots(
      hours.open,
      hours.close,
      facility.slotDurationMinutes,
    );

    // Fetch all active bookings + offers for this date in ONE query
    const [activeBookings, activeOffers] = await Promise.all([
      this.bookingModel
        .find({
          facilityId: new Types.ObjectId(facilityId),
          date,
          status: { $in: ['confirmed', 'pending_payment', 'awaiting_payment'] },
        })
        .select('startTime status')
        .lean(),
      this.getActiveOffersForDate(facilityId, date),
    ]);

    const bookedMap = new Map(activeBookings.map((b) => [b.startTime, b.status]));
    const offerMap = new Map(activeOffers.map((o: any) => [o.startTime, o.discountedPrice]));

    const now = new Date();
    const isToday = date === today;

    return allSlots.map((slot) => {
      // Past time today → closed
      if (isToday && this.isTimePast(slot.startTime, now)) {
        return { ...slot, status: 'closed' as const, price: facility.pricePerSlot };
      }

      const bookingStatus = bookedMap.get(slot.startTime);
      const discountedPrice = offerMap.get(slot.startTime);

      if (bookingStatus === 'confirmed') {
        return { ...slot, status: 'booked' as const, price: facility.pricePerSlot };
      }
      if (bookingStatus === 'pending_payment' || bookingStatus === 'awaiting_payment') {
        return { ...slot, status: 'pending' as const, price: facility.pricePerSlot };
      }

      return {
        ...slot,
        status: 'available' as const,
        price: facility.pricePerSlot,
        ...(discountedPrice ? { discountedPrice } : {}),
      };
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generateTimeSlots(
    openTime: string,
    closeTime: string,
    durationMinutes: number,
  ): { startTime: string; endTime: string }[] {
    const slots: { startTime: string; endTime: string }[] = [];
    let current = this.timeToMinutes(openTime);
    const end = this.timeToMinutes(closeTime);

    while (current + durationMinutes <= end) {
      slots.push({
        startTime: this.minutesToTime(current),
        endTime: this.minutesToTime(current + durationMinutes),
      });
      current += durationMinutes;
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private getDayName(date: string): DayOfWeek {
    const days: DayOfWeek[] = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
    ];
    return days[new Date(date).getDay()];
  }

  private isTimePast(slotTime: string, now: Date): boolean {
    const [h, m] = slotTime.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
  }

  private async getActiveOffersForDate(facilityId: string, date: string): Promise<any[]> {
    const OfferModel = this.connection.model('Offer');
    return OfferModel.find({
      facilityId: new Types.ObjectId(facilityId),
      date,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).lean();
  }

  // ─── Rating ────────────────────────────────────────────────────────────────

  async rateFacility(facilityId: string, userId: string, value: number): Promise<{ rating: number; ratingCount: number }> {
    if (!await this.facilityModel.exists({ _id: facilityId, isActive: true })) {
      throw new NotFoundException('الملعب غير موجود.');
    }
    if (value < 1 || value > 5) {
      throw new BadRequestException('التقييم يجب أن يكون بين 1 و 5.');
    }

    // Upsert: update if exists, create if not
    await this.ratingModel.updateOne(
      { userId: new Types.ObjectId(userId), facilityId: new Types.ObjectId(facilityId) },
      { $set: { value } },
      { upsert: true },
    );

    // Recalculate average from all ratings for this facility
    const [agg] = await this.ratingModel.aggregate([
      { $match: { facilityId: new Types.ObjectId(facilityId) } },
      { $group: { _id: null, avg: { $avg: '$value' }, count: { $sum: 1 } } },
    ]);

    const newRating = agg ? Math.round(agg.avg * 10) / 10 : value;
    const newCount  = agg?.count ?? 1;

    await this.facilityModel.updateOne(
      { _id: facilityId },
      { $set: { rating: newRating, ratingCount: newCount } },
    );

    return { rating: newRating, ratingCount: newCount };
  }

  async getMyRating(facilityId: string, userId: string): Promise<number | null> {
    const r = await this.ratingModel
      .findOne({ facilityId: new Types.ObjectId(facilityId), userId: new Types.ObjectId(userId) })
      .lean();
    return r ? r.value : null;
  }

  async findOneAndAssertOwner(facilityId: string, ownerId: string): Promise<FacilityDocument> {
    const facility = await this.facilityModel.findById(facilityId);
    if (!facility) throw new NotFoundException('الملعب غير موجود.');
    if (facility.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا الملعب.');
    }
    return facility;
  }

  async incrementBookingCount(facilityId: string): Promise<void> {
    await this.facilityModel.updateOne({ _id: facilityId }, { $inc: { totalBookings: 1 } });
  }
}
