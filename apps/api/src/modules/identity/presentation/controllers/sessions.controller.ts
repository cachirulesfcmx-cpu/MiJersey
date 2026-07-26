import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  UseFilters,
} from '@nestjs/common';

import { ListSessionsUseCase } from '../../application/use-cases/list-sessions.use-case';
import { RevokeAllSessionsUseCase } from '../../application/use-cases/revoke-all-sessions.use-case';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case';
import type { AccessTokenPayload } from '../../domain/ports/token.service.port';
import { CurrentUser } from '../decorators/current-user.decorator';
import { IdentityExceptionFilter } from '../filters/identity-exception.filter';

@Controller('sessions')
@UseFilters(IdentityExceptionFilter)
export class SessionsController {
  constructor(
    private readonly listSessionsUseCase: ListSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly revokeAllSessionsUseCase: RevokeAllSessionsUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AccessTokenPayload) {
    const sessions = await this.listSessionsUseCase.execute(user.sub);

    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === user.sid,
    }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.revokeSessionUseCase.execute({
      sessionId: id,
      requestingUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAll(@CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.revokeAllSessionsUseCase.execute({
      userId: user.sub,
      exceptSessionId: user.sid,
      ipAddress: ip,
    });
  }
}
