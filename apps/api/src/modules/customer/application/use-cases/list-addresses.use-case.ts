import { Inject, Injectable } from '@nestjs/common';

import { ADDRESS_REPOSITORY } from '../../customer.constants';
import type { AddressEntity } from '../../domain/entities/address.entity';
import type { AddressRepositoryPort } from '../../domain/ports/address.repository.port';

@Injectable()
export class ListAddressesUseCase {
  constructor(@Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepositoryPort) {}

  async execute(customerId: string): Promise<AddressEntity[]> {
    return this.addresses.findByCustomerId(customerId);
  }
}
