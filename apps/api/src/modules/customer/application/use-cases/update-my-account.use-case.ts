import { Inject, Injectable } from '@nestjs/common';

import { UpdateProfileUseCase } from '../../../identity/application/use-cases/update-profile.use-case';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CUSTOMER_PROFILE_REPOSITORY } from '../../customer.constants';
import type { CustomerPreferences } from '../../domain/entities/customer-profile.entity';
import type { CustomerProfileRepositoryPort } from '../../domain/ports/customer-profile.repository.port';
import { GetMyAccountUseCase, type MyAccountView } from './get-my-account.use-case';

export interface UpdateMyAccountInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  preferences?: CustomerPreferences;
}

/** `firstName`/`lastName` se delegan a `UpdateProfileUseCase` (003, reutilizado tal cual — spec §5 "la actualización del perfil no deberá afectar pedidos históricos", que ya cumple porque `Order` guarda su propio `contactEmail`, no una referencia viva al perfil). `phone`/`preferences` son de 019. */
@Injectable()
export class UpdateMyAccountUseCase {
  constructor(
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly getMyAccount: GetMyAccountUseCase,
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profiles: CustomerProfileRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateMyAccountInput): Promise<MyAccountView> {
    await this.updateProfile.execute({
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    await this.profiles.upsert(input.userId, {
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.preferences !== undefined ? { preferences: input.preferences } : {}),
    });

    await this.auditLog.record({
      userId: input.userId,
      action: 'customer.profile_updated',
      ipAddress: null,
      metadata: {},
    });

    return this.getMyAccount.execute(input.userId);
  }
}
