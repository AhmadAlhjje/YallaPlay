import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @UsePipes(new ZodValidationPipe(CreateBookingDto))
  create(@CurrentUser() user: JwtPayloadType, @Body() dto: CreateBookingDtoType) {
    return this.bookingsService.createBooking(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail (with QR token for athlete)' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.bookingsService.findOne(id, user.sub, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking (athlete cancels own / owner cancels theirs)' })
  @UsePipes(new ZodValidationPipe(CancelBookingDto))
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadType,
    @Body() dto: CancelBookingDtoType,
  ) {
    return this.bookingsService.cancelBooking(id, user.sub, user.role, dto);
  }

  @Patch(':id/share-whatsapp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Athlete] Mark booking as shared via WhatsApp' })
  markShared(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.bookingsService.markSharedViaWhatsapp(id, user.sub);
  }

  // ─── Owner endpoints ───────────────────────────────────────────────────────

  @Post('confirm-qr')
  @Roles('owner')
  @ApiOperation({ summary: '[Owner] Confirm payment by validating QR token' })
  confirmByQr(@CurrentUser() user: JwtPayloadType, @Body('qrToken') qrToken: string) {
    return this.bookingsService.confirmBooking(qrToken, user.sub);
  }

  @Get('facility/:facilityId')
  @Roles('owner')
  @ApiOperation({ summary: '[Owner] List all bookings for a facility' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  findByFacility(
    @Param('facilityId') facilityId: string,
    @CurrentUser() user: JwtPayloadType,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findByFacility(facilityId, user.sub, date, status);
  }
}
