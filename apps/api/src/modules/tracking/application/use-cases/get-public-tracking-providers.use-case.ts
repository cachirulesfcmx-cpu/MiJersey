import { Inject, Injectable } from '@nestjs/common';

import type { PublicTrackingProvider } from '../../domain/entities/tracking-provider.entity';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { TRACKING_PROVIDER_REPOSITORY } from '../../tracking.constants';

/** `GET /tracking/providers` (033 §7, sin autenticación) — el storefront (013 Home y demás páginas) lo consulta para inyectar los scripts de los proveedores activos, con solo los campos seguros de exponer (`toPublicJSON`). */
@Injectable()
export class GetPublicTrackingProvidersUseCase {
  constructor(
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
  ) {}

  async execute(): Promise<PublicTrackingProvider[]> {
    const active = await this.providers.findActive();
    return active.map((provider) => provider.toPublicJSON());
  }
}
