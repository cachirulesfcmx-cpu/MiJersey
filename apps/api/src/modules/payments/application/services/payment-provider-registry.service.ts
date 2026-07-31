import { Injectable } from '@nestjs/common';

import { UnsupportedPaymentProviderError } from '../../domain/errors/payments.errors';
import type { PaymentProviderPort } from '../../domain/ports/payment-provider.port';

/** Punto único de extensión para nuevos proveedores (spec §2 "múltiples proveedores... mediante adaptadores") — agregar Stripe/Mercado Pago/PayPal es registrar una nueva implementación de `PaymentProviderPort` aquí, sin tocar los casos de uso. */
@Injectable()
export class PaymentProviderRegistry {
  private readonly providers = new Map<string, PaymentProviderPort>();

  register(provider: PaymentProviderPort): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): PaymentProviderPort {
    const provider = this.providers.get(name);
    if (!provider) throw new UnsupportedPaymentProviderError(name);
    return provider;
  }
}
