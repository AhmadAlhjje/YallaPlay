import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.mongoose-schema';
import { Facility, FacilityDocument } from '../../database/schemas/facility.mongoose-schema';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { PlanTier, UserRole } from '@yallaplay/shared-types';

interface AdminUserFilter {
  role?: UserRole;
  plan?: PlanTier;
  isActive?: boolean;
  search?: string;
  page: number;
  limit: number;
}

interface AdminFacilityFilter {
  sport?: string;
  plan?: string;
  isActive?: boolean;
  search?: string;
  ownerId?: string;
  page: number;
  limit: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  // ─── User Management ───────────────────────────────────────────────────────

  async listUsers(filter: AdminUserFilter) {
    const query: Record<string, unknown> = {};

    if (filter.role) query['role'] = filter.role;
    if (filter.plan) query['plan'] = filter.plan;
    if (filter.isActive !== undefined) query['isActive'] = filter.isActive;
    if (filter.search) {
      query['$or'] = [
        { name: { $regex: filter.search, $options: 'i' } },
        { phone: { $regex: filter.search } },
      ];
    }

    const skip = (filter.page - 1) * filter.limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-otpHash -otpExpiresAt -refreshTokenHash -deviceTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter.limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total,
        pages: Math.ceil(total / filter.limit),
      },
    };
  }

  async getUserDetail(userId: string) {
    const [user, bookingStats] = await Promise.all([
      this.userModel
        .findById(userId)
        .select('-otpHash -otpExpiresAt -refreshTokenHash')
        .lean(),
      this.bookingModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            spent: { $sum: '$totalPrice' },
          },
        },
      ]),
    ]);

    if (!user) throw new NotFoundException('المستخدم غير موجود.');

    const stats = bookingStats.reduce(
      (acc, s) => {
        acc[s._id] = { count: s.count, spent: s.spent };
        return acc;
      },
      {} as Record<string, { count: number; spent: number }>,
    );

    return { user, bookingStats: stats };
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('المستخدم غير موجود.');
    if (user.role === 'admin') throw new BadRequestException('لا يمكن تعليق حساب مدير.');

    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: { isActive: false },
        $unset: { refreshTokenHash: 1 }, // Force logout
      },
    );

    this.logger.warn(`Admin suspended user ${userId}: ${reason}`);
  }

  async reactivateUser(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $set: { isActive: true } });
  }

  async overridePlan(userId: string, plan: PlanTier, expiresAt?: Date): Promise<void> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('المستخدم غير موجود.');

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { plan, ...(expiresAt ? { planExpiresAt: expiresAt } : {}) } },
    );

    this.logger.log(`Admin overrode plan for user ${userId} → ${plan}`);
  }

  // ─── Facility Management ───────────────────────────────────────────────────

  async listFacilities(filter: AdminFacilityFilter) {
    const query: Record<string, unknown> = {};

    if (filter.sport) query['sports'] = filter.sport;
    if (filter.isActive !== undefined) query['isActive'] = filter.isActive;
    if (filter.ownerId) query['ownerId'] = new Types.ObjectId(filter.ownerId);
    if (filter.search) {
      query['$or'] = [
        { name: { $regex: filter.search, $options: 'i' } },
        { address: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const skip = (filter.page - 1) * filter.limit;

    const [facilities, total] = await Promise.all([
      this.facilityModel
        .find(query)
        .populate('ownerId', 'name phone plan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter.limit)
        .lean(),
      this.facilityModel.countDocuments(query),
    ]);

    return {
      facilities,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total,
        pages: Math.ceil(total / filter.limit),
      },
    };
  }

  async getFacilityDetail(facilityId: string) {
    const [facility, bookingStats] = await Promise.all([
      this.facilityModel
        .findById(facilityId)
        .populate('ownerId', 'name phone plan planExpiresAt')
        .lean(),
      this.bookingModel.aggregate([
        { $match: { facilityId: new Types.ObjectId(facilityId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
      ]),
    ]);

    if (!facility) throw new NotFoundException('الملعب غير موجود.');

    const stats = bookingStats.reduce(
      (acc, s) => {
        acc[s._id] = { count: s.count, revenue: s.revenue };
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    return { facility, bookingStats: stats };
  }

  async adminSuspendFacility(facilityId: string, reason: string): Promise<void> {
    const facility = await this.facilityModel.findById(facilityId).lean();
    if (!facility) throw new NotFoundException('الملعب غير موجود.');

    await this.facilityModel.updateOne(
      { _id: facilityId },
      { isActive: false, deletedAt: new Date() },
    );

    this.logger.warn(`Admin suspended facility ${facilityId}: ${reason}`);
  }

  async adminRestoreFacility(facilityId: string): Promise<void> {
    await this.facilityModel.updateOne(
      { _id: facilityId },
      { isActive: true, $unset: { deletedAt: 1 } },
    );
  }

  // ─── Booking Management ────────────────────────────────────────────────────

  async listAllBookings(
    page: number,
    limit: number,
    status?: string,
    facilityId?: string,
    userId?: string,
    from?: string,
    to?: string,
  ) {
    const query: Record<string, unknown> = {};

    if (status) query['status'] = status;
    if (facilityId) query['facilityId'] = new Types.ObjectId(facilityId);
    if (userId) query['userId'] = new Types.ObjectId(userId);
    if (from || to) {
      query['date'] = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(query)
        .populate('facilityId', 'name address')
        .populate('userId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookingModel.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
