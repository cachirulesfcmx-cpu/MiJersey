import { Body, Controller, Get, Patch, UseFilters } from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { GetMyAccountUseCase } from '../../application/use-cases/get-my-account.use-case';
import { UpdateMyAccountUseCase } from '../../application/use-cases/update-my-account.use-case';
import { UpdateMyAccountDto } from '../dto/update-my-account.dto';
import { CustomerExceptionFilter } from '../filters/customer-exception.filter';

/** Todas las rutas de `/me` requieren sesión (guard global `JwtAuthGuard`, sin `@Public()`) — no hay una noción de permiso aquí, solo "es tu propia cuenta" (spec §10). */
@Controller('me')
@UseFilters(CustomerExceptionFilter)
export class MyAccountController {
  constructor(
    private readonly getMyAccount: GetMyAccountUseCase,
    private readonly updateMyAccount: UpdateMyAccountUseCase,
  ) {}

  @Get()
  async get(@CurrentUser() user: AccessTokenPayload) {
    return this.getMyAccount.execute(user.sub);
  }

  @Patch()
  async update(@Body() dto: UpdateMyAccountDto, @CurrentUser() user: AccessTokenPayload) {
    return this.updateMyAccount.execute({
      userId: user.sub,
      firstName: dto.firstName,
      lastName: dto.lastName,
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.preferences !== undefined ? { preferences: dto.preferences } : {}),
    });
  }
}
