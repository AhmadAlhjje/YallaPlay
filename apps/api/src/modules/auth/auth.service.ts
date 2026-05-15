import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../database/schemas/user.mongoose-schema';
import { RegisterDtoType, LoginDtoType, SendOtpDtoType, VerifyOtpDtoType, JwtPayloadType } from '@yallaplay/shared-types';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly BCRYPT_ROUNDS = 10;
  private readonly POINTS_PER_BOOKING = 5;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
    private whatsapp: WhatsappService,
  ) {}

  async register(dto: RegisterDtoType): Promise<{ message: string }> {
    const existing = await this.userModel
      .findOne({ phone: dto.phone })
      .select('+passwordHash +isPhoneVerified')
      .lean();

    // Already verified account with this phone → must login
    if (existing && existing.isPhoneVerified && existing.passwordHash) {
      throw new ConflictException('رقم الهاتف مسجل مسبقاً. يرجى تسجيل الدخول.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert a pending (unverified) user record with all registration data
    await this.userModel.findOneAndUpdate(
      { phone: dto.phone },
      {
        $set: {
          name: dto.name,
          passwordHash,
          skillLevel: dto.skillLevel ?? 'beginner',
          preferredSports: dto.preferredSports ?? [],
          isPhoneVerified: false,
          otpHash,
          otpExpiresAt,
        },
        $setOnInsert: {
          phone: dto.phone,
          role: dto.role ?? 'athlete',
        },
      },
      { upsert: true, new: true },
    );

    await this.dispatchOtp(dto.phone, otp);
    this.logger.log(`Registration OTP sent to ${dto.phone}`);

    const isDev = this.config.get('NODE_ENV') === 'development';
    return { message: isDev ? `OTP: ${otp}` : 'تم إرسال رمز التحقق إلى هاتفك' };
  }

  async login(dto: LoginDtoType): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<UserDocument>;
    isNewUser: boolean;
  }> {
    const user = await this.userModel
      .findOne({ phone: dto.phone })
      .select('+passwordHash +isPhoneVerified')
      .lean();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash as string);
    if (!isValid) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة.');
    }

    // Account not yet phone-verified → resend OTP and ask to verify
    if (!user.isPhoneVerified) {
      const otp = this.generateOtp();
      const otpHash = await bcrypt.hash(otp, this.BCRYPT_ROUNDS);
      const otpExpiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
      await this.userModel.updateOne({ _id: user._id }, { $set: { otpHash, otpExpiresAt } });
      await this.dispatchOtp(dto.phone, otp);
      const isDev = this.config.get('NODE_ENV') === 'development';
      this.logger.log(`Re-sent OTP to unverified user ${dto.phone}${isDev ? ` | OTP: ${otp}` : ''}`);
      return { accessToken: '', refreshToken: '', user: {}, isNewUser: true };
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS);
    await this.userModel.updateOne({ _id: user._id }, { $set: { refreshTokenHash } });

    const { passwordHash: _ph, otpHash: _oh, otpExpiresAt: _oe, refreshTokenHash: _rth, isPhoneVerified: _ipv, ...safeUser } = user as any;
    return { accessToken, refreshToken, user: safeUser, isNewUser: false };
  }

  async sendOtp(dto: SendOtpDtoType): Promise<{ message: string }> {
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.userModel.findOneAndUpdate(
      { phone: dto.phone },
      {
        $set: { otpHash, otpExpiresAt },
        $setOnInsert: { role: dto.role, name: 'مستخدم جديد', phone: dto.phone },
      },
      { upsert: true, new: true, select: '+otpHash +otpExpiresAt' },
    );

    // Send OTP via SMS provider
    await this.dispatchOtp(dto.phone, otp);

    this.logger.log(`OTP sent to ${dto.phone}`);
    // In development, return OTP directly — NEVER in production
    const isDev = this.config.get('NODE_ENV') === 'development';
    return { message: isDev ? `OTP: ${otp}` : 'تم إرسال رمز التحقق إلى هاتفك' };
  }

  async verifyOtp(dto: VerifyOtpDtoType): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<UserDocument>;
    isNewUser: boolean;
  }> {
    const user = await this.userModel
      .findOne({ phone: dto.phone })
      .select('+otpHash +otpExpiresAt')
      .lean();

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new BadRequestException('يرجى طلب رمز تحقق أولاً.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.');
    }

    const isValid = await bcrypt.compare(dto.otp, user.otpHash);
    if (!isValid) {
      throw new UnauthorizedException('رمز التحقق غير صحيح.');
    }

    const isNewUser = user.name === 'مستخدم جديد';

    const { accessToken, refreshToken } = await this.issueTokens(user);

    // Clear OTP, activate account, store refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS);
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $unset: { otpHash: 1, otpExpiresAt: 1 },
        $set: { refreshTokenHash, isPhoneVerified: true },
      },
    );

    const { otpHash, otpExpiresAt, refreshTokenHash: _rth, ...safeUser } = user as any;

    return { accessToken, refreshToken, user: safeUser, isNewUser };
  }

  async refreshTokens(
    incomingRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JwtPayloadType;
    try {
      payload = await this.jwtService.verifyAsync(incomingRefreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية.');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshTokenHash')
      .lean();

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('الجلسة غير صالحة.');
    }

    const isValid = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!isValid) {
      // Potential token reuse — invalidate all sessions
      await this.userModel.updateOne({ _id: payload.sub }, { $unset: { refreshTokenHash: 1 } });
      throw new UnauthorizedException('تم اكتشاف نشاط مريب. يرجى تسجيل الدخول مجدداً.');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.issueTokens(user);

    // Rotate: invalidate old refresh token
    const newHash = await bcrypt.hash(newRefreshToken, this.BCRYPT_ROUNDS);
    await this.userModel.updateOne({ _id: payload.sub }, { $set: { refreshTokenHash: newHash } });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId).select('+passwordHash').lean();
    if (!user) throw new BadRequestException('المستخدم غير موجود.');
    if (!user.passwordHash) throw new BadRequestException('لا يمكن تغيير كلمة المرور لهذا الحساب.');

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة.');

    if (newPassword.length < 6) throw new BadRequestException('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');

    const newHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.userModel.updateOne({ _id: userId }, { $set: { passwordHash: newHash } });
  }

  private async issueTokens(
    user: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Omit<JwtPayloadType, 'iat' | 'exp'> = {
      sub: user._id.toString(),
      phone: user.phone,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    return Math.floor(100_000 + Math.random() * 900_000).toString();
  }

  private async dispatchOtp(phone: string, otp: string): Promise<void> {
    const provider = this.config.get('SMS_PROVIDER', 'console');
    const isDev = this.config.get('NODE_ENV') === 'development';

    if (provider === 'console') {
      this.logger.debug(`[OTP MOCK] Phone: ${phone} | OTP: ${otp}`);
      return;
    }

    if (provider === 'whatsapp') {
      try {
        await this.whatsapp.sendOtp(phone, otp);
        this.logger.log(`✅ OTP sent via WhatsApp to ${phone}`);
        return;
      } catch (err) {
        this.logger.error(`❌ WhatsApp failed for ${phone}: ${(err as any)?.message}`);
        if (isDev) {
          this.logger.warn(`══════════════════════════════════════`);
          this.logger.warn(`  DEV FALLBACK — OTP for ${phone}`);
          this.logger.warn(`  CODE: ${otp}`);
          this.logger.warn(`══════════════════════════════════════`);
          this.logger.warn(`  افتح WhatsApp وامسح QR أو تحقق من الاتصال`);
          return;
        }
        throw err;
      }
    }
    // Twilio — add when SMS credentials are ready
  }
}
