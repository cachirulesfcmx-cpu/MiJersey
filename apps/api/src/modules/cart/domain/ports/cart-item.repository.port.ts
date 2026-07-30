import type { CartItemEntity } from '../entities/cart-item.entity';

export interface CreateCartItemData {
  cartId: string;
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface UpdateCartItemData {
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CartItemRepositoryPort {
  findById(id: string): Promise<CartItemEntity | null>;
  findByCartId(cartId: string): Promise<CartItemEntity[]>;
  findByCartAndVariant(cartId: string, variantId: string): Promise<CartItemEntity | null>;
  create(data: CreateCartItemData): Promise<CartItemEntity>;
  update(id: string, data: UpdateCartItemData): Promise<CartItemEntity>;
  delete(id: string): Promise<void>;
}
