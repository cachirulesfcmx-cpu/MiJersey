import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { OrderRepositoryPort } from '../../../orders/domain/ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../orders/orders.constants';
import type { PromotionUsageEntity } from '../../domain/entities/promotion-usage.entity';
import { OrderNotFoundError } from '../../domain/errors/promotions.errors';
import type { PromotionRepositoryPort } from '../../domain/ports/promotion.repository.port';
import type { PromotionUsageRepositoryPort } from '../../domain/ports/promotion-usage.repository.port';
import { PROMOTION_REPOSITORY, PROMOTION_USAGE_REPOSITORY } from '../../promotions.constants';

export interface RecordPromotionUsageInput {
  orderId: string;
}

/**
 * Disparado por el storefront justo después de `POST /checkout/confirm` (mismo patrón que
 * `authorizePayment`/`capturePayment`, 022, se llaman como pasos separados tras confirmar) — no
 * requiere ningún cambio en Checkout/Orders. Lee `Order.couponCode` (021) vía `ORDER_REPOSITORY`
 * para encontrar la promoción y registrar su uso; `@@unique([orderId])` en `PromotionUsage` hace
 * esto idempotente frente a reintentos del cliente. Si el pedido no tiene cupón, o el código no
 * corresponde a ninguna promoción de este motor, no hace nada (no es un error).
 */
@Injectable()
export class RecordPromotionUsageUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort,
    @Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort,
    @Inject(PROMOTION_USAGE_REPOSITORY) private readonly usages: PromotionUsageRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RecordPromotionUsageInput): Promise<PromotionUsageEntity | null> {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new OrderNotFoundError();

    const orderJson = order.toJSON();
    if (!orderJson.couponCode) return null;

    const existing = await this.usages.findByOrderId(input.orderId);
    if (existing) return existing;

    const promotion = await this.promotions.findByCode(orderJson.couponCode);
    if (!promotion) return null;

    const usage = await this.usages.create({
      promotionId: promotion.id,
      orderId: input.orderId,
      customerId: orderJson.customerId,
      discountAmount: orderJson.discountTotal,
    });
    await this.promotions.incrementUsageCount(promotion.id);

    await this.auditLog.record({
      userId: orderJson.customerId,
      action: 'promotion.used',
      ipAddress: null,
      metadata: {
        promotionId: promotion.id,
        orderId: input.orderId,
        discountAmount: orderJson.discountTotal,
      },
    });

    return usage;
  }
}
