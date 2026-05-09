import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayloadType } from '@yallaplay/shared-types';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notification inbox (paginated)' })
  getInbox(
    @CurrentUser() user: JwtPayloadType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.notificationsService.getInbox(user.sub, page, limit);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: JwtPayloadType) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  markOneRead(@Param('id') id: string, @CurrentUser() user: JwtPayloadType) {
    return this.notificationsService.markOneRead(user.sub, id);
  }
}
