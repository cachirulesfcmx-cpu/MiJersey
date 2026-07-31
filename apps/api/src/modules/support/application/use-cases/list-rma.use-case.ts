import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { RmaRequestEntity } from '../../domain/entities/rma-request.entity';
import type {
  ListRmaParams,
  RmaRequestRepositoryPort,
} from '../../domain/ports/rma-request.repository.port';
import { RMA_REPOSITORY } from '../../support.constants';

@Injectable()
export class ListRmaUseCase {
  constructor(@Inject(RMA_REPOSITORY) private readonly rmaRequests: RmaRequestRepositoryPort) {}

  async execute(params: ListRmaParams): Promise<PaginatedResult<RmaRequestEntity>> {
    return this.rmaRequests.findMany(params);
  }
}
