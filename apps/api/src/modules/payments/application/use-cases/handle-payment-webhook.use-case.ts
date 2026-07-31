import { Inject, Injectable } from '@nestjs/common';

import {
  InvalidWebhookSignatureError,
  PaymentNotFoundError,
} from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import { PAYMENT_EVENT_REPOSITORY, PAYMENT_REPOSITORY } from '../../payments.constants';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';

export interface HandlePaymentWebhookInput {
  provider: string;
  rawBody: string;
  signature: string | undefined;
}

interface WebhookPayload {
  transactionId: string;
  eventType: string;
}

/**
 * Spec §8 "verificación de firmas de webhooks" + §10 "registrar... recepción de webhooks".
 * `ManualPaymentProvider` es síncrono (autorizar/capturar/reembolsar resuelven de inmediato en la
 * misma petición) — no depende de notificaciones asíncronas para avanzar su propio estado, así que
 * este endpoint no dispara transiciones adicionales; su función es registrar el evento de forma
 * verificable y ser el punto donde un proveedor real (que sí notifica de forma asíncrona)
 * conectaría sus propias transiciones sin cambios estructurales aquí.
 */
@Injectable()
export class HandlePaymentWebhookUseCase {
  constructor(
    private readonly providerRegistry: PaymentProviderRegistry,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_REPOSITORY) private readonly events: PaymentEventRepositoryPort,
  ) {}

  async execute(input: HandlePaymentWebhookInput): Promise<void> {
    const provider = this.providerRegistry.get(input.provider);
    if (!provider.verifyWebhookSignature(input.rawBody, input.signature)) {
      throw new InvalidWebhookSignatureError();
    }

    const payload = JSON.parse(input.rawBody) as WebhookPayload;
    const payment = await this.payments.findByProviderTransactionId(
      provider.name,
      payload.transactionId,
    );
    if (!payment) throw new PaymentNotFoundError();

    await this.events.create({
      paymentId: payment.id,
      eventType: `webhook.${payload.eventType}`,
      payload: payload as unknown as Record<string, unknown>,
    });
  }
}
