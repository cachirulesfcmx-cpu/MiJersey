import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { RmaRequestEntity } from '../entities/rma-request.entity';
import type { RmaStatus } from '../value-objects/support-enums';

export interface CreateRmaData {
  rmaNumber: string;
  ticketId: string | null;
  orderId: string;
  customerId: string;
  reason: string;
  itemsDescription: string;
}

export interface ListRmaParams extends PaginationParams {
  customerId?: string;
  status?: RmaStatus;
}

export interface RmaRequestRepositoryPort {
  findById(id: string): Promise<RmaRequestEntity | null>;
  findMany(params: ListRmaParams): Promise<PaginatedResult<RmaRequestEntity>>;
  create(data: CreateRmaData): Promise<RmaRequestEntity>;
  updateStatus(id: string, status: RmaStatus): Promise<RmaRequestEntity>;
}
