import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtPayloadType } from '@yallaplay/shared-types';
import { User, UserDocument } from '../../../database/schemas/user.mongoose-schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayloadType): Promise<JwtPayloadType> {
    const user = await this.userModel.findOne({ _id: payload.sub, isActive: true }).lean();
    if (!user) {
      throw new UnauthorizedException('الجلسة غير صالحة. يرجى تسجيل الدخول مجدداً.');
    }
    return payload;
  }
}
