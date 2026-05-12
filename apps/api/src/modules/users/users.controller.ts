import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import {
  UpdateUserDto,
  UpdateLocationDto,
  JwtPayloadType,
  UpdateUserDtoType,
} from '@yallaplay/shared-types';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: JwtPayloadType) {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  updateProfile(
    @CurrentUser() user: JwtPayloadType,
    @Body(new ZodValidationPipe(UpdateUserDto)) dto: UpdateUserDtoType,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch('me/location')
  @ApiOperation({ summary: 'Update GPS location for nearby search' })
  updateLocation(
    @CurrentUser() user: JwtPayloadType,
    @Body(new ZodValidationPipe(UpdateLocationDto)) dto: { longitude: number; latitude: number },
  ) {
    return this.usersService.updateLocation(user.sub, dto.longitude, dto.latitude);
  }

  @Get('me/points')
  @ApiOperation({ summary: 'Get points balance' })
  getPoints(@CurrentUser() user: JwtPayloadType) {
    return this.usersService.getPointsBalance(user.sub);
  }

  @Get('me/points/history')
  @ApiOperation({ summary: 'Get points transaction history' })
  getPointsHistory(
    @CurrentUser() user: JwtPayloadType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getPointsHistory(user.sub, page, limit);
  }

  @Get('me/bookings')
  @ApiOperation({ summary: 'Get booking history (upcoming/past/all)' })
  getBookings(
    @CurrentUser() user: JwtPayloadType,
    @Query('filter') filter: 'upcoming' | 'past' | 'all' = 'all',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getBookingHistory(user.sub, filter, page, limit);
  }

  @Post('me/device-token')
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  addDeviceToken(@CurrentUser() user: JwtPayloadType, @Body('token') token: string) {
    return this.usersService.addDeviceToken(user.sub, token);
  }

  @Delete('me/device-token')
  @ApiOperation({ summary: 'Remove FCM device token on logout' })
  removeDeviceToken(@CurrentUser() user: JwtPayloadType, @Body('token') token: string) {
    return this.usersService.removeDeviceToken(user.sub, token);
  }

  @Get('me/favorites')
  @ApiOperation({ summary: 'Get user favorite facilities' })
  getFavorites(@CurrentUser() user: JwtPayloadType) {
    return this.usersService.getFavorites(user.sub);
  }

  @Post('me/favorites/:facilityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add facility to favorites' })
  addFavorite(
    @CurrentUser() user: JwtPayloadType,
    @Param('facilityId') facilityId: string,
  ) {
    return this.usersService.addFavorite(user.sub, facilityId);
  }

  @Delete('me/favorites/:facilityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove facility from favorites' })
  removeFavorite(
    @CurrentUser() user: JwtPayloadType,
    @Param('facilityId') facilityId: string,
  ) {
    return this.usersService.removeFavorite(user.sub, facilityId);
  }
}
