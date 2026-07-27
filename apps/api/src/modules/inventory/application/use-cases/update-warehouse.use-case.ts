import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { WarehouseEntity } from '../../domain/entities/warehouse.entity';
import { WarehouseNotFoundError } from '../../domain/errors/inventory.errors';
import type { WarehouseRepositoryPort } from '../../domain/ports/warehouse.repository.port';
import type { WarehouseStatus } from '../../domain/value-objects/inventory-enums';
import { WAREHOUSE_REPOSITORY } from '../../inventory.constants';

export interface UpdateWarehouseInput {
  id: string;
  name?: string;
  status?: WarehouseStatus;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateWarehouseInput): Promise<WarehouseEntity> {
    const existing = await this.warehouses.findById(input.id);
    if (!existing) {
      throw new WarehouseNotFoundError();
    }

    const warehouse = await this.warehouses.update(input.id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'inventory.warehouse.updated',
      ipAddress: input.ipAddress,
      metadata: { warehouseId: input.id },
    });

    return warehouse;
  }
}
