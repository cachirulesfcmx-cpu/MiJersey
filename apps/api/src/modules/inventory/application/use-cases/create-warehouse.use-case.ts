import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { WarehouseEntity } from '../../domain/entities/warehouse.entity';
import { WarehouseCodeAlreadyExistsError } from '../../domain/errors/inventory.errors';
import type { WarehouseRepositoryPort } from '../../domain/ports/warehouse.repository.port';
import { WAREHOUSE_REPOSITORY } from '../../inventory.constants';

export interface CreateWarehouseInput {
  code: string;
  name: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateWarehouseInput): Promise<WarehouseEntity> {
    const code = input.code.trim().toUpperCase();

    if (await this.warehouses.existsByCode(code)) {
      throw new WarehouseCodeAlreadyExistsError();
    }

    const warehouse = await this.warehouses.create({ code, name: input.name.trim() });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'inventory.warehouse.created',
      ipAddress: input.ipAddress,
      metadata: { warehouseId: warehouse.id, code },
    });

    return warehouse;
  }
}
