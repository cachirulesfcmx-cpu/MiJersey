import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { MediaAssetEntity, type MediaAssetProps } from '../../domain/entities/media-asset.entity';
import { MediaAssetInUseError, MediaAssetNotFoundError } from '../../domain/errors/media.errors';
import type { MediaAssetRepositoryPort } from '../../domain/ports/media-asset.repository.port';
import type { MediaAssetUsageRepositoryPort } from '../../domain/ports/media-usage.repository.port';
import type { StoragePort } from '../../domain/ports/storage.port';
import { MediaAssetStatus, MediaType } from '../../domain/value-objects/media-enums';
import { DeleteMediaUseCase } from './delete-media.use-case';

function buildAsset(overrides: Partial<MediaAssetProps> = {}): MediaAssetEntity {
  return new MediaAssetEntity({
    id: 'asset-1',
    filename: 'stored.jpg',
    originalName: 'photo.jpg',
    mimeType: 'image/jpeg',
    type: MediaType.IMAGE,
    size: 1024,
    width: 800,
    height: 600,
    duration: null,
    altText: null,
    title: null,
    status: MediaAssetStatus.ACTIVE,
    contentHash: 'hash-1',
    storageKey: 'stored.jpg',
    url: 'http://localhost:4000/uploads/stored.jpg',
    thumbnailUrl: null,
    folderId: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(asset: MediaAssetEntity | null, usageCount: number) {
  const assets: jest.Mocked<MediaAssetRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(asset),
    findByContentHash: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    replaceTags: jest.fn(),
    delete: jest.fn(),
  };
  const usages: jest.Mocked<MediaAssetUsageRepositoryPort> = {
    record: jest.fn(),
    remove: jest.fn(),
    countByAsset: jest.fn().mockResolvedValue(usageCount),
    findByAsset: jest.fn(),
  };
  const storage: jest.Mocked<StoragePort> = {
    save: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    resolvePath: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new DeleteMediaUseCase(assets, usages, storage, auditLog),
    assets,
    usages,
    storage,
  };
}

describe('DeleteMediaUseCase', () => {
  it('throws when the asset does not exist', async () => {
    const { useCase } = buildUseCase(null, 0);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(MediaAssetNotFoundError);
  });

  it('refuses to delete an asset that still has usage references', async () => {
    const asset = buildAsset();
    const { useCase, assets, storage } = buildUseCase(asset, 2);

    await expect(
      useCase.execute({ id: asset.id, actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(MediaAssetInUseError);

    expect(assets.delete).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('deletes the asset and its stored file when there are no references', async () => {
    const asset = buildAsset();
    const { useCase, assets, storage } = buildUseCase(asset, 0);

    await useCase.execute({ id: asset.id, actorUserId: 'staff-1', ipAddress: null });

    expect(assets.delete).toHaveBeenCalledWith(asset.id);
    expect(storage.delete).toHaveBeenCalledWith(asset.storageKey);
  });

  it('also deletes the thumbnail file when the asset has one', async () => {
    const asset = buildAsset({
      thumbnailUrl: 'http://localhost:4000/uploads/thumb-key.webp',
    });
    const { useCase, storage } = buildUseCase(asset, 0);

    await useCase.execute({ id: asset.id, actorUserId: 'staff-1', ipAddress: null });

    expect(storage.delete).toHaveBeenCalledWith('thumb-key.webp');
  });
});
