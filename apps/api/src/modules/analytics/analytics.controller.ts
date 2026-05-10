import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayloadType } from '@yallaplay/shared-types';

type Granularity = 'daily' | 'weekly' | 'monthly';

// ─── Owner Analytics (/analytics/owner/*) ─────────────────────────────────────
@ApiTags('Analytics — Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
@Controller('analytics/owner')
export class OwnerAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: "Today / this month / all-time KPIs for owner's facilities" })
  getSummary(@CurrentUser() user: JwtPayloadType) {
    return this.analyticsService.getOwnerSummary(user.sub);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue chart (daily/weekly/monthly)' })
  @ApiQuery({ name: 'granularity', enum: ['daily', 'weekly', 'monthly'] })
  @ApiQuery({ name: 'from', description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'facilityId', required: false })
  getRevenue(
    @CurrentUser() user: JwtPayloadType,
    @Query('granularity') granularity: Granularity = 'monthly',
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.analyticsService.getOwnerRevenueChart(
      user.sub,
      facilityId,
      granularity,
      from,
      to,
    );
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Booking heatmap by day-of-week and hour' })
  @ApiQuery({ name: 'facilityId', required: false })
  getHeatmap(
    @CurrentUser() user: JwtPayloadType,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.analyticsService.getOwnerBookingHeatmap(user.sub, facilityId);
  }

  @Get('top-slots')
  @ApiOperation({ summary: 'Most booked time slots' })
  @ApiQuery({ name: 'facilityId', required: false })
  getTopSlots(
    @CurrentUser() user: JwtPayloadType,
    @Query('facilityId') facilityId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.analyticsService.getOwnerTopSlots(user.sub, facilityId, limit);
  }

  @Get('cancellation-rate')
  @ApiOperation({ summary: 'Cancellation rate over a date range' })
  getCancellationRate(
    @CurrentUser() user: JwtPayloadType,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getOwnerCancellationRate(user.sub, from, to);
  }
}

// ─── Admin Platform Analytics (/analytics/admin/*) ────────────────────────────
@ApiTags('Analytics — Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('analytics/admin')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Platform-wide KPIs: users, revenue, bookings' })
  getPlatformSummary() {
    return this.analyticsService.getPlatformSummary();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Platform-wide revenue chart' })
  @ApiQuery({ name: 'granularity', enum: ['daily', 'weekly', 'monthly'] })
  getRevenue(
    @Query('granularity') granularity: Granularity = 'monthly',
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getPlatformRevenueChart(granularity, from, to);
  }

  @Get('top-facilities')
  @ApiOperation({ summary: 'Top facilities by total bookings' })
  getTopFacilities(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.analyticsService.getTopFacilities(limit);
  }

  @Get('facility-breakdown')
  @ApiOperation({ summary: 'Revenue and bookings per facility over a date range' })
  getFacilityBreakdown(@Query('from') from: string, @Query('to') to: string) {
    return this.analyticsService.getFacilityBreakdown(from, to);
  }
}
