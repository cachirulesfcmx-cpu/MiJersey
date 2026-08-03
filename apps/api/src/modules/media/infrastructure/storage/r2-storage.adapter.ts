import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { StoragePort, StoredFile } from '../../domain/ports/storage.port';

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

/**
 * Almacenamiento remoto en Cloudflare R2 (compatible con la API S3) — reemplazo de
 * `LocalDiskStorageAdapter` para que los archivos sobrevivan un redeploy (el disco del
 * contenedor de Railway es efímero, ver `LocalDiskStorageAdapter`). Activado con
 * `STORAGE_DRIVER=r2` + las 5 variables `R2_*` (ver `env.schema.ts`).
 *
 * `resolvePath` no tiene un equivalente real en un bucket remoto — a diferencia del disco
 * local, ningún caso de uso actual lee el archivo recién guardado desde una ruta de
 * filesystem (`MediaProcessingService` procesa el buffer en memoria antes de subirlo), así
 * que se implementa como no-op devolviendo el `storageKey` para satisfacer la interfaz.
 */
@Injectable()
export class R2StorageAdapter implements StoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    if (
      !config.r2Bucket ||
      !config.r2Endpoint ||
      !config.r2AccessKeyId ||
      !config.r2SecretAccessKey ||
      !config.r2PublicUrl
    ) {
      throw new Error(
        'STORAGE_DRIVER=r2 requiere R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_PUBLIC_URL',
      );
    }

    this.bucket = config.r2Bucket;
    this.publicUrl = config.r2PublicUrl.replace(/\/$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.r2Endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey,
      },
    });
  }

  async save(buffer: Buffer, extension: string): Promise<StoredFile> {
    const storageKey = `${randomUUID()}${extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: CONTENT_TYPE_BY_EXTENSION[extension] ?? 'application/octet-stream',
      }),
    );

    return { storageKey, url: `${this.publicUrl}/${storageKey}` };
  }

  async delete(storageKey: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }))
      .catch(() => undefined);
  }

  resolvePath(storageKey: string): string {
    return storageKey;
  }
}
