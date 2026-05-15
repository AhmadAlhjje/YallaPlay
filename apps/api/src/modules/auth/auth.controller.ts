import {
  Controller,
  Post,
  Body,
  UsePipes,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  RegisterDtoType,
  LoginDtoType,
  SendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  SendOtpDtoType,
  VerifyOtpDtoType,
  JwtPayloadType,
} from '@yallaplay/shared-types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user with phone + password' })
  @UsePipes(new ZodValidationPipe(RegisterDto))
  register(@Body() dto: RegisterDtoType) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone + password' })
  @UsePipes(new ZodValidationPipe(LoginDto))
  login(@Body() dto: LoginDtoType) {
    return this.authService.login(dto);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @UsePipes(new ZodValidationPipe(SendOtpDto))
  sendOtp(@Body() dto: SendOtpDtoType) {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and receive tokens' })
  @UsePipes(new ZodValidationPipe(VerifyOtpDto))
  verifyOtp(@Body() dto: VerifyOtpDtoType) {
    return this.authService.verifyOtp(dto);
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  @UsePipes(new ZodValidationPipe(RefreshTokenDto))
  refresh(@Body() dto: { refreshToken: string }) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate refresh token' })
  logout(@CurrentUser() user: JwtPayloadType) {
    return this.authService.logout(user.sub);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (requires old password)' })
  changePassword(
    @CurrentUser() user: JwtPayloadType,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(user.sub, oldPassword, newPassword);
  }
}
