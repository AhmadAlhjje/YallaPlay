import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Booking, BookingDocument } from '../../database/schemas/booking.mongoose-schema';
import { Facility, FacilityDocument } from '../../database/schemas/facility.mongoose-schema';
import { User, UserDocument } from '../../database/schemas/user.mongoose-schema';
import { FacilitiesService } from '../facilities/facilities.service';

type Granularity = 'daily' | 'weekly' | 'monthly';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private facilitiesService: FacilitiesService,
  ) {}

  // ─── Owner Analytics ───────────────────────────────────────────────────────

  async getOwnerSummary(ownerId: string) {
    const facilityIds = await this.getOwnerFacilityIds(ownerId);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    const [todayStats, monthStats, totalStats, facilityCount] = await Promise.all([
      this.aggregatePeriod(facilityIds, todayStr, todayStr),
      this.aggregatePeriod(facilityIds, monthStart, todayStr),
      this.aggregateAllTime(facilityIds),
      this.facilityModel.countDocuments({
        ownerId: new Types.ObjectId(ownerId),
        isActive: true,
      }),
    ]);

    return {
      today: todayStats,
      thisMonth: monthStats,
      allTime: totalStats,
      facilityCount,
    };
  }

  async getOwnerRevenueChart(
    ownerId: string,
    facilityId: string | undefined,
    granularity: Granularity,
    from: string,
    to: string,
  ) {
    let facilityIds: Types.ObjectId[];

    if (facilityId) {
      // Assert owner owns this facility
      await this.facilitiesService.findOneAndAssertOwner(facilityId, ownerId);
      facilityIds = [new Types.ObjectId(facilityId)];
    } else {
      facilityIds = await this.getOwnerFacilityIds(ownerId);
    }

    return this.buildRevenueChart(facilityIds, granularity, from, to);
  }

  async getOwnerBookingHeatmap(ownerId: string, facilityId?: string) {
    let facilityIds: Types.ObjectId[];

    if (facilityId) {
      await this.facilitiesService.findOneAndAssertOwner(facilityId, ownerId);
      facilityIds = [new Types.ObjectId(facilityId)];
    } else {
      facilityIds = await this.getOwnerFacilityIds(ownerId);
    }

    // Aggregate bookings by day-of-week and hour — for heatmap display
    const pipeline: PipelineStage[] = [
      {
        $match: {
          facilityId: { $in: facilityIds },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $addFields: {
          hour: { $toInt: { $substr: ['$startTime', 0, 2] } },
          dayOfWeek: {
            $dayOfWeek: { $dateFromString: { dateString: '$date' } },
          },
        },
      },
      {
        $group: {
          _id: { dayOfWeek: '$dayOfWeek', hour: '$hour' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ];

    const raw = await this.bookingModel.aggregate(pipeline);

    return raw.map((r) => ({
      dayOfWeek: r._id.dayOfWeek, // 1=Sunday … 7=Saturday
      hour: r._id.hour,
      bookings: r.count,
      revenue: r.revenue,
    }));
  }

  async getOwnerTopSlots(ownerId: string, facilityId?: string, limit = 10) {
    let facilityIds: Types.ObjectId[];
    if (facilityId) {
      await this.facilitiesService.findOneAndAssertOwner(facilityId, ownerId);
      facilityIds = [new Types.ObjectId(facilityId)];
    } else {
      facilityIds = await this.getOwnerFacilityIds(ownerId);
    }

    return this.bookingModel.aggregate([
      {
        $match: {
          facilityId: { $in: facilityIds },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$startTime',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          startTime: '$_id',
          bookings: 1,
          revenue: 1,
        },
      },
    ]);
  }

  async getOwnerCancellationRate(ownerId: string, from: string, to: string) {
    const facilityIds = await this.getOwnerFacilityIds(ownerId);

    const [total, cancelled] = await Promise.all([
      this.bookingModel.countDocuments({
        facilityId: { $in: facilityIds },
        date: { $gte: from, $lte: to },
        status: { $in: ['confirmed', 'completed', 'cancelled', 'no_show'] },
      }),
      this.bookingModel.countDocuments({
        facilityId: { $in: facilityIds },
        date: { $gte: from, $lte: to },
        status: 'cancelled',
      }),
    ]);

    return {
      total,
      cancelled,
      rate: total > 0 ? Math.round((cancelled / total) * 100 * 10) / 10 : 0,
    };
  }

  // ─── Admin Platform Analytics ──────────────────────────────────────────────

  async getPlatformSummary() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    const [
      totalUsers,
      totalOwners,
      totalFacilities,
      activeFacilities,
      todayBookings,
      monthRevenue,
      totalRevenue,
      newUsersThisMonth,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: 'athlete', isActive: true }),
      this.userModel.countDocuments({ role: 'owner', isActive: true }),
      this.facilityModel.countDocuments(),
      this.facilityModel.countDocuments({ isActive: true }),
      this.bookingModel.countDocuments({
        date: todayStr,
        status: { $in: ['confirmed', 'pending_payment'] },
      }),
      this.bookingModel.aggregate([
        {
          $match: {
            date: { $gte: monthStart, $lte: todayStr },
            status: { $in: ['confirmed', 'completed'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      this.bookingModel.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      this.userModel.countDocuments({
        role: 'athlete',
        createdAt: { $gte: new Date(monthStart) },
      }),
    ]);

    return {
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      owners: totalOwners,
      facilities: { total: totalFacilities, active: activeFacilities },
      bookings: { today: todayBookings },
      revenue: {
        thisMonth: monthRevenue[0]?.total ?? 0,
        allTime: totalRevenue[0]?.total ?? 0,
      },
    };
  }

  async getPlatformRevenueChart(granularity: Granularity, from: string, to: string) {
    // All facilities — no filter
    return this.buildRevenueChart(undefined, granularity, from, to);
  }

  async getTopFacilities(limit = 10) {
    return this.facilityModel
      .find({ isActive: true })
      .sort({ totalBookings: -1 })
      .limit(limit)
      .populate('ownerId', 'name phone')
      .select('name address sports totalBookings rating pricePerSlot plan')
      .lean();
  }

  async getFacilityBreakdown(from: string, to: string) {
    return this.bookingModel.aggregate([
      {
        $match: {
          date: { $gte: from, $lte: to },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$facilityId',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      {
        $lookup: {
          from: 'facilities',
          localField: '_id',
          foreignField: '_id',
          as: 'facility',
        },
      },
      { $unwind: '$facility' },
      {
        $project: {
          _id: 0,
          facilityId: '$_id',
          name: '$facility.name',
          bookings: 1,
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);
  }

  // ─── Shared Helpers ────────────────────────────────────────────────────────

  private async buildRevenueChart(
    facilityIds: Types.ObjectId[] | undefined,
    granularity: Granularity,
    from: string,
    to: string,
  ) {
    const matchFilter: Record<string, unknown> = {
      date: { $gte: from, $lte: to },
      status: { $in: ['confirmed', 'completed'] },
    };

    if (facilityIds) {
      matchFilter['facilityId'] = { $in: facilityIds };
    }

    const dateGroupExpr =
      granularity === 'daily'
        ? '$date'
        : granularity === 'weekly'
          ? {
              $dateToString: {
                format: '%Y-W%V',
                date: { $dateFromString: { dateString: '$date' } },
              },
            }
          : {
              $dateToString: {
                format: '%Y-%m',
                date: { $dateFromString: { dateString: '$date' } },
              },
            };

    const pipeline: PipelineStage[] = [
      { $match: matchFilter },
      {
        $group: {
          _id: dateGroupExpr,
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          bookings: 1,
          cancelled: 1,
        },
      },
    ];

    return this.bookingModel.aggregate(pipeline);
  }

  private async aggregatePeriod(
    facilityIds: Types.ObjectId[],
    from: string,
    to: string,
  ) {
    const result = await this.bookingModel.aggregate([
      {
        $match: {
          facilityId: { $in: facilityIds },
          date: { $gte: from, $lte: to },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
    ]);

    return { revenue: result[0]?.revenue ?? 0, bookings: result[0]?.bookings ?? 0 };
  }

  private async aggregateAllTime(facilityIds: Types.ObjectId[]) {
    return this.aggregatePeriod(facilityIds, '2000-01-01', '2099-12-31');
  }

  private async getOwnerFacilityIds(ownerId: string): Promise<Types.ObjectId[]> {
    const facilities = await this.facilityModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .select('_id')
      .lean();
    return facilities.map((f) => f._id as Types.ObjectId);
  }
}
