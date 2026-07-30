import type { CouponEntity } from '../entities/coupon.entity';
import type { CouponType } from '../value-objects/cart-enums';

export interface CreateCouponData {
  code: string;
  type: CouponType;
  value: number;
  isActive?: boolean;
  expiresAt?: Date | null;
}

export interface UpdateCouponData {
  type?: CouponType;
  value?: number;
  isActive?: boolean;
  expiresAt?: Date | null;
}

export interface CouponRepositoryPort {
  findById(id: string): Promise<CouponEntity | null>;
  findByCode(code: string): Promise<CouponEntity | null>;
  findMany(): Promise<CouponEntity[]>;
  create(data: CreateCouponData): Promise<CouponEntity>;
  update(id: string, data: UpdateCouponData): Promise<CouponEntity>;
  delete(id: string): Promise<void>;
}
