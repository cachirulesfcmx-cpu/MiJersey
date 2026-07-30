import type { CartEntity } from '../entities/cart.entity';
import type { CartStatus } from '../value-objects/cart-enums';

export interface CreateCartData {
  sessionId: string;
  customerId?: string | null;
  currency: string;
}

export interface CartRepositoryPort {
  findById(id: string): Promise<CartEntity | null>;
  findActiveBySessionId(sessionId: string): Promise<CartEntity | null>;
  findActiveByCustomerId(customerId: string): Promise<CartEntity | null>;
  create(data: CreateCartData): Promise<CartEntity>;
  attachCustomer(id: string, customerId: string): Promise<CartEntity>;
  updateStatus(id: string, status: CartStatus): Promise<CartEntity>;
  setCoupon(id: string, couponCode: string | null): Promise<CartEntity>;
}
