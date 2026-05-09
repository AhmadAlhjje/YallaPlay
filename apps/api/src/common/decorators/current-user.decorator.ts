import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadType } from '@yallaplay/shared-types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadType => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayloadType;
  },
);
