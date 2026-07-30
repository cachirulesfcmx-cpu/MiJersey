import { Inject, Injectable } from '@nestjs/common';

import { COUPON_REPOSITORY } from '../../cart.constants';
import { CouponEntity } from '../../domain/entities/coupon.entity';
import type { CouponRepositoryPort } from '../../domain/ports/coupon.repository.port';

@Injectable()
export class ListCouponsUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort) {}

  execute(): Promise<CouponEntity[]> {
    return this.coupons.findMany();
  }
}
