import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AccessTokenPayload } from '../../domain/ports/token.service.port';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    return request.user as AccessTokenPayload;
  },
);
