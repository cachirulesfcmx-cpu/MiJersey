import { Inject, Injectable } from '@nestjs/common';

import type { CarrierEntity } from '../../domain/entities/carrier.entity';
import type { CarrierRepositoryPort } from '../../domain/ports/carrier.repository.port';
import { CARRIER_REPOSITORY } from '../../shipping.constants';

export interface ListCarriersInput {
  onlyActive?: boolean;
}

@Injectable()
export class ListCarriersUseCase {
  constructor(@Inject(CARRIER_REPOSITORY) private readonly carriers: CarrierRepositoryPort) {}

  async execute(input: ListCarriersInput = {}): Promise<CarrierEntity[]> {
    return input.onlyActive ? this.carriers.findActive() : this.carriers.findMany();
  }
}
