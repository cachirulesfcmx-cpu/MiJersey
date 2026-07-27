import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';

import { InvalidUploadError } from '../../domain/errors/media.errors';
import type { StoragePort } from '../../domain/ports/storage.port';
import { MediaType } from '../../domain/value-objects/media-enums';
import { STORAGE_PORT, THUMBNAIL_MAX_HEIGHT, THUMBNAIL_MAX_WIDTH } from '../../media.constants';

export interface MediaProcessingResult {
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnailUrl: string | null;
}

/**
 * Procesamiento síncrono hoy, con firma preparada para despacharse a una cola
 * más adelante sin cambiar a quien la llama (spec §7 "procesamiento asíncrono
 * preparado para colas futuras"). La duración de video queda en null: extraerla
 * requiere ffprobe, fuera de alcance de este entorno.
 */
@Injectable()
export class MediaProcessingService {
  constructor(@Inject(STORAGE_PORT) private readonly storage: StoragePort) {}

  async process(buffer: Buffer, type: MediaType): Promise<MediaProcessingResult> {
    if (type !== MediaType.IMAGE) {
      return { width: null, height: null, duration: null, thumbnailUrl: null };
    }

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      const thumbnailBuffer = await image
        .resize(THUMBNAIL_MAX_WIDTH, THUMBNAIL_MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat('webp')
        .toBuffer();
      const thumbnail = await this.storage.save(thumbnailBuffer, '.webp');

      return {
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        duration: null,
        thumbnailUrl: thumbnail.url,
      };
    } catch {
      throw new InvalidUploadError('El archivo de imagen está dañado o no se pudo procesar');
    }
  }
}
