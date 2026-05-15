import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateBookingDto,
  CancelBookingDto,
  JwtPayloadType,
  CreateBookingDtoType,
  CancelBookingDtoType,
} from '@yallaplay/shared-types';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ─── Athlete endpoints ─────────────────────────────────────────────────────

  @Post()
  @Roles('athlete')
  @ApiOperation({ summary: '[Athlete] Create a booking (atomic slot lock)' })
  create(@CurrentUser() user: JwtPayloadType, @Body(new ZodValidationPipe(CreateBookingDto)) dto: CreateBookingDtoType) {
    return this.bookingsService.createBooking(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail (with QR token for athlete)' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.bookingsService.findOne(id, user.sub, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking (athlete cancels own / owner cancels theirs)' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadType,
    @Body(new ZodValidationPipe(CancelBookingDto)) dto: CancelBookingDtoType,
  ) {
    return this.bookingsService.cancelBooking(id, user.sub, user.role, dto);
  }

  @Patch(':id/share-whatsapp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Athlete] Mark booking as shared via WhatsApp' })
  markShared(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.bookingsService.markSharedViaWhatsapp(id, user.sub);
  }

  @Patch(':id/payment-submitted')
  @ApiOperation({ summary: '[Athlete] Mark payment submitted (with optional screenshot) and notify owner' })
  markPaymentSubmitted(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadType,
    @Body('screenshot') screenshot?: string,
  ) {
    return this.bookingsService.markPaymentSubmitted(id, user.sub, screenshot);
  }

  // ─── Owner endpoints ───────────────────────────────────────────────────────

  @Post('owner-add')
  @UseGuards(RolesGuard)
  @Roles('owner')
  @ApiOperation({ summary: '[Owner] Add a manual (walk-in) booking, confirmed immediately' })
  ownerAdd(@CurrentUser() user: JwtPayloadType, @Body() dto: any) {
    return this.bookingsService.ownerAddBooking(user.sub, dto);
  }

  @Post('confirm-qr')
  @UseGuards(RolesGuard)
  @Roles('owner')
  @ApiOperation({ summary: '[Owner] Confirm payment by validating QR token' })
  confirmByQr(@CurrentUser() user: JwtPayloadType, @Body('qrToken') qrToken: string) {
    return this.bookingsService.confirmBooking(qrToken, user.sub);
  }

  @Patch(':id/confirm-manual')
  @UseGuards(RolesGuard)
  @Roles('owner')
  @ApiOperation({ summary: '[Owner] Manually confirm a pending booking' })
  confirmManual(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.bookingsService.confirmBookingManual(id, user.sub);
  }

  @Get('facility/:facilityId')
  @UseGuards(RolesGuard)
  @Roles('owner')
  @ApiOperation({ summary: '[Owner] List all bookings for a facility' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  findByFacility(
    @Param('facilityId') facilityId: string,
    @CurrentUser() user: JwtPayloadType,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    return this.bookingsService.findByFacility(facilityId, user.sub, date, status, page ? Number(page) : 1);
  }
}
