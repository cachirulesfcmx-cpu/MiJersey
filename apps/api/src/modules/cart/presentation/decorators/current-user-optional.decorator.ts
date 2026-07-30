import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';

export const CurrentUserOptional = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    return request.user;
  },
);
