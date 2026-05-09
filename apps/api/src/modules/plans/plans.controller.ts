import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreatePlanDto,
  JwtPayloadType,
  CreatePlanDtoType,
  PlanTier,
} from '@yallaplay/shared-types';
import { z } from 'zod';

const UpgradePlanDto = z.object({
  plan: z.enum(['primer', 'pro', 'custom'] as const),
});

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all visible subscription plans' })
  getPublicPlans() {
    return this.plansService.getPublicPlans();
  }

  // ─── Owner ─────────────────────────────────────────────────────────────────

  @Get('my-status')
  @UseGuards(JwtAuthGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Get current plan status + feature usage' })
  getMyStatus(@CurrentUser() user: JwtPayloadType) {
    return this.plansService.getOwnerPlanStatus(user.sub);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @Roles('owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Upgrade to a higher plan tier' })
  @UsePipes(new ZodValidationPipe(UpgradePlanDto))
  upgrade(@CurrentUser() user: JwtPayloadType, @Body() dto: { plan: PlanTier }) {
    return this.plansService.upgradePlan(user.sub, dto.plan);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a new plan (incl. custom)' })
  @UsePipes(new ZodValidationPipe(CreatePlanDto))
  createPlan(@Body() dto: CreatePlanDtoType) {
    return this.plansService.createPlan(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update plan features or pricing' })
  updatePlan(@Param('id') id: string, @Body() dto: Partial<CreatePlanDtoType>) {
    return this.plansService.updatePlan(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete a custom plan' })
  deletePlan(@Param('id') id: string) {
    return this.plansService.deletePlan(id);
  }
}
