import { Inject, Injectable } from '@nestjs/common';

import type { SeoMetadataEntity } from '../../domain/entities/seo-metadata.entity';
import type { SeoMetadataRepositoryPort } from '../../domain/ports/seo-metadata.repository.port';
import type { SeoEntityType } from '../../domain/value-objects/seo-enums';
import { SEO_METADATA_REPOSITORY } from '../../seo.constants';

@Injectable()
export class GetSeoMetadataUseCase {
  constructor(
    @Inject(SEO_METADATA_REPOSITORY) private readonly seoMetadata: SeoMetadataRepositoryPort,
  ) {}

  /** `null` si la entidad todavía no tiene metadatos configurados — el admin renderiza un formulario vacío. */
  execute(entityType: SeoEntityType, entityId: string): Promise<SeoMetadataEntity | null> {
    return this.seoMetadata.findByEntity(entityType, entityId);
  }
}
