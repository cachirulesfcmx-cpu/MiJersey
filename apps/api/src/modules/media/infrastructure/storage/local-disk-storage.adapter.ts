import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { StoragePort, StoredFile } from '../../domain/ports/storage.port';

export const MEDIA_STATIC_URL_PREFIX = '/uploads';

@Injectable()
export class LocalDiskStorageAdapter implements StoragePort {
  private readonly baseDir: string;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.baseDir = resolve(process.cwd(), config.mediaUploadsDir);
  }

  async save(buffer: Buffer, extension: string): Promise<StoredFile> {
    const storageKey = `${randomUUID()}${extension}`;
    const path = this.resolvePath(storageKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer);

    return {
      storageKey,
      url: `${this.config.publicApiUrl}${MEDIA_STATIC_URL_PREFIX}/${storageKey}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(this.resolvePath(storageKey)).catch(() => undefined);
  }

  resolvePath(storageKey: string): string {
    return join(this.baseDir, storageKey);
  }
}
