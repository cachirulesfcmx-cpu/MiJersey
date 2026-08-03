import { Module } from '@nestjs/common';

import { APP_CONFIG } from '../../config/env.config';
import type { AppConfig } from '../../config/env.schema';
import { IdentityModule } from '../identity/identity.module';
import { MediaProcessingService } from './application/services/media-processing.service';
import { MediaUsageService } from './application/services/media-usage.service';
import { CreateFolderUseCase } from './application/use-cases/create-folder.use-case';
import { DeleteFolderUseCase } from './application/use-cases/delete-folder.use-case';
import { DeleteMediaUseCase } from './application/use-cases/delete-media.use-case';
import { GetMediaUseCase } from './application/use-cases/get-media.use-case';
import { ListFoldersUseCase } from './application/use-cases/list-folders.use-case';
import { ListMediaUseCase } from './application/use-cases/list-media.use-case';
import { ListTagsUseCase } from './application/use-cases/list-tags.use-case';
import { MoveFolderUseCase } from './application/use-cases/move-folder.use-case';
import { UpdateFolderUseCase } from './application/use-cases/update-folder.use-case';
import { UpdateMediaUseCase } from './application/use-cases/update-media.use-case';
import { UploadMediaUseCase } from './application/use-cases/upload-media.use-case';
import { PrismaAssetTagRepository } from './infrastructure/persistence/prisma-asset-tag.repository';
import { PrismaFolderRepository } from './infrastructure/persistence/prisma-folder.repository';
import { PrismaMediaAssetRepository } from './infrastructure/persistence/prisma-media-asset.repository';
import { PrismaMediaAssetUsageRepository } from './infrastructure/persistence/prisma-media-usage.repository';
import { LocalDiskStorageAdapter } from './infrastructure/storage/local-disk-storage.adapter';
import { R2StorageAdapter } from './infrastructure/storage/r2-storage.adapter';
import {
  ASSET_TAG_REPOSITORY,
  FOLDER_REPOSITORY,
  MEDIA_ASSET_REPOSITORY,
  MEDIA_ASSET_USAGE_REPOSITORY,
  STORAGE_PORT,
} from './media.constants';
import { AdminFoldersController } from './presentation/controllers/admin-folders.controller';
import { AdminMediaController } from './presentation/controllers/admin-media.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminMediaController, AdminFoldersController],
  providers: [
    ListMediaUseCase,
    GetMediaUseCase,
    UploadMediaUseCase,
    UpdateMediaUseCase,
    DeleteMediaUseCase,
    ListTagsUseCase,
    CreateFolderUseCase,
    UpdateFolderUseCase,
    MoveFolderUseCase,
    DeleteFolderUseCase,
    ListFoldersUseCase,
    MediaProcessingService,
    MediaUsageService,
    { provide: MEDIA_ASSET_REPOSITORY, useClass: PrismaMediaAssetRepository },
    { provide: FOLDER_REPOSITORY, useClass: PrismaFolderRepository },
    { provide: ASSET_TAG_REPOSITORY, useClass: PrismaAssetTagRepository },
    { provide: MEDIA_ASSET_USAGE_REPOSITORY, useClass: PrismaMediaAssetUsageRepository },
    LocalDiskStorageAdapter,
    {
      // No se registra R2StorageAdapter como provider de Nest: su constructor lanza si faltan
      // las variables R2_* (fail-fast intencional), y Nest instanciaría igual la clase aunque
      // STORAGE_DRIVER fuera 'local' por estar listada en `providers`. Se construye a mano aquí,
      // solo cuando de verdad se va a usar.
      provide: STORAGE_PORT,
      useFactory: (config: AppConfig, local: LocalDiskStorageAdapter) =>
        config.storageDriver === 'r2' ? new R2StorageAdapter(config) : local,
      inject: [APP_CONFIG, LocalDiskStorageAdapter],
    },
  ],
  exports: [MediaUsageService],
})
export class MediaModule {}
