import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.mongoose-schema';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { UpdateUserDtoType, UpdateLocationDto } from '@yallaplay/shared-types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('المستخدم غير موجود.');
    return user as UserDocument;
  }

  async updateProfile(userId: string, dto: UpdateUserDtoType): Promise<UserDocument> {
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('المستخدم غير موجود.');
    return updated as UserDocument;
  }

  async updateLocation(userId: string, longitude: number, latitude: number): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          location: { type: 'Point', coordinates: [longitude, latitude] },
        },
      },
    );
  }

  async addDeviceToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { deviceTokens: token } }, // $addToSet prevents duplicates
    );
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { deviceTokens: token } },
    );
  }

  async addFavorite(userId: string, facilityId: string): Promise<void> {
    if (!Types.ObjectId.isValid(facilityId)) throw new BadRequestException('معرّف الملعب غير صحيح');
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { favorites: new Types.ObjectId(facilityId) } },
    );
  }

  async removeFavorite(userId: string, facilityId: string): Promise<void> {
    if (!Types.ObjectId.isValid(facilityId)) throw new BadRequestException('معرّف الملعب غير صحيح');
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { favorites: new Types.ObjectId(facilityId) } },
    );
  }

  async getFavorites(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('favorites')
      .populate('favorites', 'name address images rating pricePerSlot sports')
      .lean();
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user.favorites ?? [];
  }

  async getPointsBalance(userId: string): Promise<{ points: number }> {
    const user = await this.userModel.findById(userId).select('points').lean();
    if (!user) throw new NotFoundException('المستخدم غير موجود.');
    return { points: user.points };
  }

  async getBookingHistory(
    userId: string,
    filter: 'upcoming' | 'past' | 'all' = 'all',
    page = 1,
    limit = 20,
  ) {
    const now = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

    if (filter === 'upcoming') {
      query['date'] = { $gte: now };
      query['status'] = { $in: ['confirmed', 'pending_payment'] };
    } else if (filter === 'past') {
      query['$or'] = [
        { date: { $lt: now } },
        { status: { $in: ['completed', 'cancelled', 'no_show'] } },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(query)
        .populate('facilityId', 'name address images phone location')
        .sort({ date: filter === 'upcoming' ? 1 : -1, startTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.bookingModel.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getPointsHistory(userId: string, page = 1, limit = 20) {
    // Points history derived from booking events
    const bookings = await this.bookingModel
      .find({
        userId: new Types.ObjectId(userId),
        pointsEarned: { $gt: 0 },
      })
      .select('pointsEarned status date facilityId createdAt')
      .populate('facilityId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return bookings.map((b) => ({
      points: b.pointsEarned,
      type: b.status === 'cancelled' ? 'deducted' : 'earned',
      description: `حجز في ${(b.facilityId as any)?.name || 'ملعب'}`,
      date: b.createdAt,
    }));
  }
}
