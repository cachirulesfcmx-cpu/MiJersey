import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type {
  PaymentProviderPort,
  ProviderAuthorizeInput,
  ProviderAuthorizeResult,
  ProviderCaptureResult,
  ProviderRefundResult,
} from '../../domain/ports/payment-provider.port';
import { MANUAL_PROVIDER } from '../../payments.constants';

/**
 * Pago manual (efectivo/transferencia bancaria, confirmado por un agente) — un método de pago
 * real usado por comercios, no un simulador. Es el único proveedor de este módulo verificable de
 * punta a punta sin credenciales de un servicio externo (no hay llaves de Stripe/Mercado
 * Pago/PayPal en este entorno). "Autoriza" de inmediato (la promesa de pago del cliente) y queda
 * pendiente de "capturar" cuando el agente confirma que el dinero efectivamente llegó.
 *
 * La verificación de firma usa HMAC-SHA256 sobre el cuerpo JSON re-serializado de forma
 * determinista — una simplificación deliberada frente a un proveedor real, que firma sobre los
 * bytes crudos de la petición antes de cualquier parseo. Conectar un proveedor real exigiría
 * capturar el cuerpo crudo (middleware dedicado) en vez de reutilizar `JSON.stringify` aquí.
 */
@Injectable()
export class ManualPaymentProvider implements PaymentProviderPort {
  readonly name = MANUAL_PROVIDER;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async authorize(input: ProviderAuthorizeInput): Promise<ProviderAuthorizeResult> {
    const transactionId = `${MANUAL_PROVIDER}-${randomUUID()}`;
    return Promise.resolve({
      transactionId,
      status: 'AUTHORIZED',
      raw: { orderId: input.orderId, amount: input.amount, currency: input.currency },
    });
  }

  async capture(transactionId: string): Promise<ProviderCaptureResult> {
    return Promise.resolve({ status: 'CAPTURED', raw: { transactionId } });
  }

  async refund(transactionId: string, amount?: number): Promise<ProviderRefundResult> {
    return Promise.resolve({
      status: amount !== undefined ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
      raw: { transactionId, amount: amount ?? null },
    });
  }

  verifyWebhookSignature(payload: string, signature: string | undefined): boolean {
    if (!signature) return false;

    const expected = createHmac('sha256', this.config.paymentsManualWebhookSecret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== signatureBuffer.length) return false;

    return timingSafeEqual(expectedBuffer, signatureBuffer);
  }
}
