import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ADDRESS_REPOSITORY } from '../../customer.constants';
import type { AddressEntity } from '../../domain/entities/address.entity';
import type {
  AddressRepositoryPort,
  CreateAddressData,
} from '../../domain/ports/address.repository.port';

/** "Existirá una dirección predeterminada por tipo" (spec §5): si la nueva dirección se marca `isDefault`, se desmarca primero cualquier otra del mismo tipo — no hay constraint de base de datos para esto, igual que "una sesión de checkout activa por carrito" en 018. */
@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(data: CreateAddressData): Promise<AddressEntity> {
    if (data.isDefault) {
      const previousDefault = await this.addresses.findDefaultByType(data.customerId, data.type);
      if (previousDefault) await this.addresses.unsetDefault(previousDefault.id);
    }

    const created = await this.addresses.create(data);

    await this.auditLog.record({
      userId: data.customerId,
      action: 'customer.address_created',
      ipAddress: null,
      metadata: { addressId: created.id, type: data.type },
    });

    return created;
  }
}
