import { Inject, Injectable } from '@nestjs/common';

import type { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { TRACKING_PROVIDER_REPOSITORY } from '../../tracking.constants';

@Injectable()
export class ListTrackingProvidersUseCase {
  constructor(
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
  ) {}

  async execute(): Promise<TrackingProviderEntity[]> {
    return this.providers.findMany();
  }
}
