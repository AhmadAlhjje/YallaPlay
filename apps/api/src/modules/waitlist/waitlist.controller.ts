import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  JoinWaitlistDto,
  JwtPayloadType,
  JoinWaitlistDtoType,
} from '@yallaplay/shared-types';

@ApiTags('Waitlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('athlete')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @ApiOperation({ summary: '[Athlete] Join waitlist for a fully-booked slot' })
  @UsePipes(new ZodValidationPipe(JoinWaitlistDto))
  join(@CurrentUser() user: JwtPayloadType, @Body() dto: JoinWaitlistDtoType) {
    return this.waitlistService.joinWaitlist(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: '[Athlete] Get my waitlist entries' })
  getMyEntries(@CurrentUser() user: JwtPayloadType) {
    return this.waitlistService.getUserWaitlistEntries(user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Athlete] Leave a waitlist' })
  leave(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.waitlistService.leaveWaitlist(user.sub, id);
  }
}
