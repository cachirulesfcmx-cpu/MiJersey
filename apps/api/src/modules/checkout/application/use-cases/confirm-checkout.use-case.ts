import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { CART_REPOSITORY, COUPON_REPOSITORY } from '../../../cart/cart.constants';
import { CartNotFoundError } from '../../../cart/domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../../cart/domain/ports/cart.repository.port';
import type { CouponRepositoryPort } from '../../../cart/domain/ports/coupon.repository.port';
import { CartStatus } from '../../../cart/domain/value-objects/cart-enums';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  CHECKOUT_INVENTORY_AVAILABILITY,
  CHECKOUT_PRODUCT_LOOKUP,
  CHECKOUT_SESSION_REPOSITORY,
  ORDER_REPOSITORY,
  SHIPPING_METHOD_REPOSITORY,
  TAX_RATE,
} from '../../checkout.constants';
import type { OrderEntity } from '../../domain/entities/order.entity';
import {
  CartEmptyError,
  CartItemsUnavailableError,
  CheckoutAlreadyConfirmedError,
  CheckoutSessionNotFoundError,
  ContactEmailRequiredError,
  ShippingAddressRequiredError,
  ShippingMethodRequiredError,
} from '../../domain/errors/checkout.errors';
import type { CheckoutInventoryAvailabilityPort } from '../../domain/ports/checkout-inventory-availability.port';
import type { CheckoutProductLookupPort } from '../../domain/ports/checkout-product-lookup.port';
import type { CheckoutSessionRepositoryPort } from '../../domain/ports/checkout-session.repository.port';
import type {
  CreateOrderItemData,
  OrderRepositoryPort,
} from '../../domain/ports/order.repository.port';
import type { ShippingMethodRepositoryPort } from '../../domain/ports/shipping-method.repository.port';
import { CheckoutStatus } from '../../domain/value-objects/checkout-enums';

export interface ConfirmCheckoutInput {
  checkoutSessionId: string;
  ipAddress: string | null;
}

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return `ORD-${date}-${suffix}`;
}

/**
 * Confirma el checkout y crea la orden (021, modelo mínimo — ver `schema.prisma`). A diferencia de
 * `ReviewCheckoutUseCase`, aquí sí se revalida todo desde cero con datos frescos: precio vigente de
 * cada variante (no el `unitPrice` guardado en `CartItem`, que puede estar desactualizado — ver
 * comentario en `schema.prisma` sobre `CartItem.unitPrice`) y disponibilidad de inventario. Spec §5:
 * "validar stock antes de confirmar" + "validar precios vigentes".
 */
@Injectable()
export class ConfirmCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
    @Inject(SHIPPING_METHOD_REPOSITORY)
    private readonly shippingMethods: ShippingMethodRepositoryPort,
    @Inject(CHECKOUT_PRODUCT_LOOKUP)
    private readonly productLookup: CheckoutProductLookupPort,
    @Inject(CHECKOUT_INVENTORY_AVAILABILITY)
    private readonly availability: CheckoutInventoryAvailabilityPort,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort,
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ConfirmCheckoutInput): Promise<OrderEntity> {
    const session = await this.sessions.findById(input.checkoutSessionId);
    if (!session) throw new CheckoutSessionNotFoundError();
    if (session.status === CheckoutStatus.CONFIRMED) throw new CheckoutAlreadyConfirmedError();
    if (!session.shippingAddressId) throw new ShippingAddressRequiredError();
    if (!session.shippingMethodId) throw new ShippingMethodRequiredError();
    if (!session.contactEmail) throw new ContactEmailRequiredError();

    const cart = await this.carts.findById(session.cartId);
    if (!cart) throw new CartNotFoundError();
    if (cart.items.length === 0) throw new CartEmptyError();

    const shippingMethod = await this.shippingMethods.findById(session.shippingMethodId);
    if (!shippingMethod) throw new ShippingMethodRequiredError();

    const variantIds = cart.items.map((item) => item.variantId);
    const [variantInfoMap, availabilityMap] = await Promise.all([
      this.productLookup.findVariantInfoMany(variantIds),
      this.availability.getAvailabilityMany(variantIds),
    ]);

    const unavailable: string[] = [];
    const orderItems: CreateOrderItemData[] = [];

    for (const item of cart.items) {
      const info = variantInfoMap.get(item.variantId);
      const available = availabilityMap.get(item.variantId) ?? 0;

      if (!info || !info.isAvailableForSale || available < item.quantity) {
        unavailable.push(item.sku);
        continue;
      }

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: info.price,
        subtotal: info.price * item.quantity,
      });
    }

    if (unavailable.length > 0) throw new CartItemsUnavailableError(unavailable);

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const coupon = cart.couponCode ? await this.coupons.findByCode(cart.couponCode) : null;
    const couponIsValid = !!coupon && coupon.isActive && !coupon.isExpired;
    const discountTotal = couponIsValid ? coupon.computeDiscount(subtotal) : 0;

    const shippingTotal = shippingMethod.basePrice;
    const taxableBase = subtotal - discountTotal + shippingTotal;
    const taxTotal = Math.round(taxableBase * TAX_RATE * 100) / 100;
    const grandTotal = taxableBase + taxTotal;

    const order = await this.orders.create({
      orderNumber: generateOrderNumber(),
      customerId: session.customerId,
      contactEmail: session.contactEmail,
      currency: cart.currency,
      subtotal,
      discountTotal,
      shippingTotal,
      taxTotal,
      grandTotal,
      couponCode: couponIsValid ? (coupon?.code ?? null) : null,
      shippingAddressId: session.shippingAddressId,
      billingAddressId: session.billingAddressId,
      shippingMethodId: session.shippingMethodId,
      items: orderItems,
    });

    await this.carts.updateStatus(cart.id, CartStatus.CONVERTED);
    await this.sessions.update(session.id, { status: CheckoutStatus.CONFIRMED, orderId: order.id });

    await this.auditLog.record({
      userId: session.customerId,
      action: 'checkout.confirmed',
      ipAddress: input.ipAddress,
      metadata: {
        checkoutSessionId: session.id,
        cartId: cart.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        grandTotal,
      },
    });

    return order;
  }
}
