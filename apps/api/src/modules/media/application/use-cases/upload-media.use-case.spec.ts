import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AssetTagEntity } from '../../domain/entities/asset-tag.entity';
import { MediaAssetEntity, type MediaAssetProps } from '../../domain/entities/media-asset.entity';
import { UnsupportedMediaTypeError } from '../../domain/errors/media.errors';
import type { AssetTagRepositoryPort } from '../../domain/ports/asset-tag.repository.port';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import type { MediaAssetRepositoryPort } from '../../domain/ports/media-asset.repository.port';
import type { StoragePort } from '../../domain/ports/storage.port';
import { MediaAssetStatus, MediaType } from '../../domain/value-objects/media-enums';
import type { MediaProcessingService } from '../services/media-processing.service';
import { UploadMediaUseCase } from './upload-media.use-case';

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

function buildUseCase() {
  const assets: jest.Mocked<MediaAssetRepositoryPort> = {
    findById: jest.fn(),
    findByContentHash: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    replaceTags: jest.fn(),
    delete: jest.fn(),
  };
  const folders: jest.Mocked<FolderRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    delete: jest.fn(),
    hasChildren: jest.fn(),
    countAssets: jest.fn(),
  };
  const tags: jest.Mocked<AssetTagRepositoryPort> = {
    findById: jest.fn(),
    findByIds: jest.fn(),
    findAll: jest.fn(),
    findOrCreateByNames: jest.fn(),
  };
  const storage: jest.Mocked<StoragePort> = {
    save: jest.fn(),
    delete: jest.fn(),
    resolvePath: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const processing = {
    process: jest.fn(),
  } as unknown as jest.Mocked<MediaProcessingService>;

  return {
    useCase: new UploadMediaUseCase(assets, folders, tags, storage, auditLog, processing),
    assets,
    folders,
    tags,
    storage,
    processing,
  };
}

describe('UploadMediaUseCase', () => {
  it('rejects unsupported mime types', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        buffer: Buffer.from('data'),
        originalName: 'file.exe',
        mimeType: 'application/x-msdownload',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeError);
  });

  it('returns the existing asset instead of re-uploading when the content hash already exists', async () => {
    const { useCase, assets, storage, processing } = buildUseCase();
    const existing = buildAsset();
    assets.findByContentHash.mockResolvedValue(existing);

    const result = await useCase.execute({
      buffer: Buffer.from('same-bytes'),
      originalName: 'duplicate.jpg',
      mimeType: 'image/jpeg',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(result).toBe(existing);
    expect(storage.save).not.toHaveBeenCalled();
    expect(processing.process).not.toHaveBeenCalled();
    expect(assets.create).not.toHaveBeenCalled();
  });

  it('stores, processes and creates a new asset when the content hash is not found', async () => {
    const { useCase, assets, storage, processing } = buildUseCase();
    assets.findByContentHash.mockResolvedValue(null);
    storage.save.mockResolvedValue({
      storageKey: 'generated.jpg',
      url: 'http://localhost:4000/uploads/generated.jpg',
    });
    processing.process.mockResolvedValue({
      width: 800,
      height: 600,
      duration: null,
      thumbnailUrl: 'http://localhost:4000/uploads/thumb.webp',
    });
    const created = buildAsset({ id: 'asset-new' });
    assets.create.mockResolvedValue(created);
    assets.findById.mockResolvedValue(created);

    const result = await useCase.execute({
      buffer: Buffer.from('new-bytes'),
      originalName: 'new-photo.jpg',
      mimeType: 'image/jpeg',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(storage.save).toHaveBeenCalled();
    expect(processing.process).toHaveBeenCalledWith(expect.any(Buffer), MediaType.IMAGE);
    expect(assets.create).toHaveBeenCalledWith(
      expect.objectContaining({ storageKey: 'generated.jpg', width: 800, height: 600 }),
    );
    expect(result).toBe(created);
  });

  it('assigns tags found or created for the uploaded asset', async () => {
    const { useCase, assets, storage, processing, tags } = buildUseCase();
    assets.findByContentHash.mockResolvedValue(null);
    storage.save.mockResolvedValue({
      storageKey: 'k.jpg',
      url: 'http://localhost:4000/uploads/k.jpg',
    });
    processing.process.mockResolvedValue({
      width: 1,
      height: 1,
      duration: null,
      thumbnailUrl: null,
    });
    const created = buildAsset({ id: 'asset-tagged' });
    assets.create.mockResolvedValue(created);
    assets.findById.mockResolvedValue(created);
    tags.findOrCreateByNames.mockResolvedValue([
      new AssetTagEntity({ id: 'tag-1', name: 'Banner', slug: 'banner' }),
    ]);

    await useCase.execute({
      buffer: Buffer.from('bytes'),
      originalName: 'x.jpg',
      mimeType: 'image/jpeg',
      tags: ['Banner'],
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(tags.findOrCreateByNames).toHaveBeenCalledWith(['Banner']);
    expect(assets.replaceTags).toHaveBeenCalledWith('asset-tagged', ['tag-1']);
  });
});
