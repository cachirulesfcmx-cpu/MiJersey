import { Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import {
  extractMediaIds,
  type HomeSectionConfiguration,
} from '../../domain/value-objects/home-section-config';
import type { HomeSectionType } from '../../domain/value-objects/home-section-enums';

const REFERENCE_TYPE = 'home.section';

/** Registra/libera el uso de los `MediaAsset` embebidos en `configuration` — mismo patrón que Brands (011) sobre `MediaUsageService` (010). */
@Injectable()
export class HomeMediaUsageService {
  constructor(private readonly mediaUsage: MediaUsageService) {}

  async applyOnCreate(
    sectionId: string,
    type: HomeSectionType,
    configuration: HomeSectionConfiguration,
  ): Promise<void> {
    const ids = extractMediaIds(type, configuration);
    await Promise.all(ids.map((id) => this.mediaUsage.recordUsage(id, REFERENCE_TYPE, sectionId)));
  }

  async applyOnUpdate(
    sectionId: string,
    type: HomeSectionType,
    previousConfiguration: HomeSectionConfiguration,
    nextConfiguration: HomeSectionConfiguration,
  ): Promise<void> {
    const previousIds = new Set(extractMediaIds(type, previousConfiguration));
    const nextIds = new Set(extractMediaIds(type, nextConfiguration));
    const added = [...nextIds].filter((id) => !previousIds.has(id));
    const removed = [...previousIds].filter((id) => !nextIds.has(id));
    await Promise.all([
      ...added.map((id) => this.mediaUsage.recordUsage(id, REFERENCE_TYPE, sectionId)),
      ...removed.map((id) => this.mediaUsage.removeUsage(id, REFERENCE_TYPE, sectionId)),
    ]);
  }

  async releaseAll(
    sectionId: string,
    type: HomeSectionType,
    configuration: HomeSectionConfiguration,
  ): Promise<void> {
    const ids = extractMediaIds(type, configuration);
    await Promise.all(ids.map((id) => this.mediaUsage.removeUsage(id, REFERENCE_TYPE, sectionId)));
  }
}
