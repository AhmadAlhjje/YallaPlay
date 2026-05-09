import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlanTier, UserRole } from '@yallaplay/shared-types';

// Every route in this controller is admin-only.
// The RolesGuard is global but we also apply JwtAuthGuard + @Roles here explicitly
// so the intent is clear when reading the file.
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Users ─────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: '[Admin] List all users with filters' })
  @ApiQuery({ name: 'role', required: false, enum: ['athlete', 'owner'] })
  @ApiQuery({ name: 'plan', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  listUsers(
    @Query('role') role?: UserRole,
    @Query('plan') plan?: PlanTier,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number = 25,
  ) {
    return this.adminService.listUsers({
      role,
      plan,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: '[Admin] Get user detail + booking statistics' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: '[Admin] Suspend user account + force logout' })
  suspendUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.suspendUser(id, reason || 'No reason given');
  }

  @Patch('users/:id/reactivate')
  @ApiOperation({ summary: '[Admin] Reactivate suspended user' })
  reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(id);
  }

  @Patch('users/:id/plan')
  @ApiOperation({ summary: '[Admin] Override user plan (assign custom plans)' })
  overridePlan(
    @Param('id') id: string,
    @Body('plan') plan: PlanTier,
    @Body('expiresAt') expiresAt?: string,
  ) {
    return this.adminService.overridePlan(
      id,
      plan,
      expiresAt ? new Date(expiresAt) : undefined,
    );
  }

  // ─── Facilities ────────────────────────────────────────────────────────────

  @Get('facilities')
  @ApiOperation({ summary: '[Admin] List all facilities with filters' })
  @ApiQuery({ name: 'sport', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  listFacilities(
    @Query('sport') sport?: string,
    @Query('search') search?: string,
    @Query('ownerId') ownerId?: string,
    @Query('isActive') isActive?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number = 25,
  ) {
    return this.adminService.listFacilities({
      sport,
      search,
      ownerId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    });
  }

  @Get('facilities/:id')
  @ApiOperation({ summary: '[Admin] Get facility detail + booking revenue stats' })
  getFacilityDetail(@Param('id') id: string) {
    return this.adminService.getFacilityDetail(id);
  }

  @Patch('facilities/:id/suspend')
  @ApiOperation({ summary: '[Admin] Suspend (soft-delete) a facility' })
  suspendFacility(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.adminSuspendFacility(id, reason || 'No reason given');
  }

  @Patch('facilities/:id/restore')
  @ApiOperation({ summary: '[Admin] Restore a suspended facility' })
  restoreFacility(@Param('id') id: string) {
    return this.adminService.adminRestoreFacility(id);
  }

  // ─── Bookings ──────────────────────────────────────────────────────────────

  @Get('bookings')
  @ApiOperation({ summary: '[Admin] Platform-wide booking log' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'facilityId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  listBookings(
    @Query('status') status?: string,
    @Query('facilityId') facilityId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number = 25,
  ) {
    return this.adminService.listAllBookings(page, limit, status, facilityId, userId, from, to);
  }
}
