import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FacilitiesService } from './facilities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
  FacilitySearchDto,
  JwtPayloadType,
  CreateFacilityDtoType,
  UpdateFacilityDtoType,
  FacilitySearchDtoType,
} from '@yallaplay/shared-types';

@ApiTags('Facilities')
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  // ─── Public endpoints ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Search facilities (text + sport + geo filter)' })
  search(@Query(new ZodValidationPipe(FacilitySearchDto)) dto: FacilitySearchDtoType) {
    return this.facilitiesService.search(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility detail' })
  findOne(@Param('id') id: string) {
    return this.facilitiesService.findById(id);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiQuery({ name: 'date', description: 'YYYY-MM-DD', required: true })
  getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.facilitiesService.getAvailableSlots(id, date);
  }

  // ─── Owner-only endpoints ──────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Create a new facility' })
  @UsePipes(new ZodValidationPipe(CreateFacilityDto))
  create(@CurrentUser() user: JwtPayloadType, @Body() dto: CreateFacilityDtoType) {
    return this.facilitiesService.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Update facility details' })
  @UsePipes(new ZodValidationPipe(UpdateFacilityDto))
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadType,
    @Body() dto: UpdateFacilityDtoType,
  ) {
    return this.facilitiesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Owner] Soft-delete facility (blocks if future bookings exist)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.facilitiesService.softDelete(id, user.sub);
  }

  @Get('owner/my-facilities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] List all my facilities' })
  findMine(@CurrentUser() user: JwtPayloadType) {
    return this.facilitiesService.findByOwner(user.sub);
  }
}
