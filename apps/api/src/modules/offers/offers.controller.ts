import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OffersService, CreateOfferDto, CreateOfferDtoType } from './offers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtPayloadType } from '@yallaplay/shared-types';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  // ─── Public ───────────────────────────────────────────────────────────────

  @Get('active')
  @ApiOperation({ summary: 'Get all currently active offers (for home screen)' })
  getActive(@Query('limit') limit?: string) {
    return this.offersService.getActiveOffers(limit ? Number(limit) : 10);
  }

  @Get('facility/:facilityId')
  @ApiOperation({ summary: 'Get active offers for a facility on a date' })
  getForDate(@Param('facilityId') facilityId: string, @Query('date') date: string) {
    return this.offersService.getActiveOffersForDate(facilityId, date);
  }

  // ─── Owner-only ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Create a flash discount on a free slot' })
  create(@CurrentUser() user: JwtPayloadType, @Body(new ZodValidationPipe(CreateOfferDto)) dto: CreateOfferDtoType) {
    return this.offersService.createOffer(user.sub, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] List my active offers' })
  getMyOffers(
    @CurrentUser() user: JwtPayloadType,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.offersService.getOwnerOffers(user.sub, facilityId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Deactivate an offer' })
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.offersService.deactivateOffer(id, user.sub);
  }
}
