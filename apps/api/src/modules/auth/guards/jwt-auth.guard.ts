import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error, user: T): T {
    if (err || !user) {
      throw new UnauthorizedException('يرجى تسجيل الدخول للمتابعة.');
    }
    return user;
  }
}
