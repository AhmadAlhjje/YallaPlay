import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { Offer, OfferDocument } from '../../database/schemas/offer.mongoose-schema';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { FacilitiesService } from '../facilities/facilities.service';

const CreateOfferDto = z.object({
  facilityId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  discountPercent: z.number().min(1).max(99),
});

export type CreateOfferDtoType = z.infer<typeof CreateOfferDto>;
export { CreateOfferDto };

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private facilitiesService: FacilitiesService,
  ) {}

  async createOffer(ownerId: string, dto: CreateOfferDtoType): Promise<OfferDocument> {
    // Assert owner owns this facility
    const facility = await this.facilitiesService.findOneAndAssertOwner(dto.facilityId, ownerId);

    // Assert slot is actually free (no confirmed/pending booking)
    const conflict = await this.bookingModel.findOne({
      facilityId: new Types.ObjectId(dto.facilityId),
      date: dto.date,
      startTime: dto.startTime,
      status: { $in: ['confirmed', 'pending_payment', 'awaiting_payment'] },
    }).lean();

    if (conflict) {
      throw new BadRequestException('لا يمكن إنشاء عرض على وقت محجوز.');
    }

    const originalPrice = facility.pricePerSlot;
    const discountedPrice = Math.round(originalPrice * (1 - dto.discountPercent / 100));

    // Offer expires when the slot time passes
    const [h, m] = dto.startTime.split(':').map(Number);
    const slotDateTime = new Date(`${dto.date}T${dto.startTime}:00`);

    // Deactivate any existing offer on this slot first
    await this.offerModel.updateMany(
      {
        facilityId: new Types.ObjectId(dto.facilityId),
        date: dto.date,
        startTime: dto.startTime,
      },
      { isActive: false },
    );

    return this.offerModel.create({
      facilityId: new Types.ObjectId(dto.facilityId),
      ownerId: new Types.ObjectId(ownerId),
      date: dto.date,
      startTime: dto.startTime,
      discountPercent: dto.discountPercent,
      originalPrice,
      discountedPrice,
      isActive: true,
      expiresAt: slotDateTime,
    });
  }

  async getActiveOffersForDate(facilityId: string, date: string): Promise<OfferDocument[]> {
    return this.offerModel
      .find({
        facilityId: new Types.ObjectId(facilityId),
        date,
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
      .lean() as unknown as OfferDocument[];
  }

  async getOwnerOffers(ownerId: string, facilityId?: string): Promise<OfferDocument[]> {
    const filter: Record<string, unknown> = {
      ownerId: new Types.ObjectId(ownerId),
      isActive: true,
    };
    if (facilityId) filter['facilityId'] = new Types.ObjectId(facilityId);
    return this.offerModel
      .find(filter)
      .populate('facilityId', 'name')
      .sort({ date: 1, startTime: 1 })
      .lean() as unknown as OfferDocument[];
  }

  async deactivateOffer(offerId: string, ownerId: string): Promise<void> {
    const offer = await this.offerModel.findById(offerId).lean();
    if (!offer) throw new NotFoundException('العرض غير موجود.');
    if (offer.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('ليس لديك صلاحية لإلغاء هذا العرض.');
    }
    await this.offerModel.updateOne({ _id: offerId }, { isActive: false });
  }

  async getActiveOffers(limit = 10): Promise<OfferDocument[]> {
    return this.offerModel
      .find({ isActive: true, expiresAt: { $gt: new Date() } })
      .populate('facilityId', 'name address images sports rating pricePerSlot')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as unknown as OfferDocument[];
  }

  // Used by FacilitiesService and BookingsService to resolve the price of a slot
  async resolveSlotPrice(
    facilityId: string,
    date: string,
    startTime: string,
    basePrice: number,
  ): Promise<{ final: number; discount: number }> {
    const offer = await this.offerModel.findOne({
      facilityId: new Types.ObjectId(facilityId),
      date,
      startTime,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!offer) return { final: basePrice, discount: 0 };

    return {
      final: offer.discountedPrice,
      discount: offer.originalPrice - offer.discountedPrice,
    };
  }
}
