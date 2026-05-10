import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { UserRole, JwtPayloadType } from '@yallaplay/shared-types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayloadType }>();
    if (!user) return true; // JwtAuthGuard handles unauthenticated requests
    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('ليس لديك صلاحية للوصول إلى هذا المورد.');
    }
    return true;
  }
}
