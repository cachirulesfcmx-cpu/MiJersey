import { Inject, Injectable } from '@nestjs/common';

import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { TRACKING_PROVIDER_REPOSITORY } from '../../tracking.constants';

/** `GET /tracking/consent` (033 §7, sin autenticación) — categorías que el Consent Banner del storefront debe ofrecer, derivadas de los proveedores configurados (no una tabla propia: el conjunto de categorías en uso lo determinan los proveedores activos). "necessary" siempre está presente aunque ningún proveedor la use. */
@Injectable()
export class GetConsentCategoriesUseCase {
  constructor(
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
  ) {}

  async execute(): Promise<string[]> {
    const active = await this.providers.findActive();
    const categories = new Set<string>(['necessary']);
    for (const provider of active) {
      if (provider.consentCategory) categories.add(provider.consentCategory);
    }
    return [...categories];
  }
}
