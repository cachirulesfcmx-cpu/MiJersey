import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type {
  PaymentRepositoryPort,
  PaymentSummaryView,
} from '../../domain/ports/payment.repository.port';
import { PAYMENT_REPOSITORY } from '../../payments.constants';

/** Refund History (spec §6, administración). */
@Injectable()
export class ListRefundsUseCase {
  constructor(@Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepositoryPort) {}

  async execute(params: PaginationParams): Promise<PaginatedResult<PaymentSummaryView>> {
    return this.payments.findRefunded(params);
  }
}
