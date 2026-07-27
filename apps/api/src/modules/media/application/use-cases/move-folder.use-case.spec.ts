import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { FolderEntity, type FolderProps } from '../../domain/entities/folder.entity';
import { FolderCycleError, FolderNotFoundError } from '../../domain/errors/media.errors';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import { MoveFolderUseCase } from './move-folder.use-case';

function buildFolder(overrides: Partial<FolderProps> = {}): FolderEntity {
  return new FolderEntity({
    id: 'folder-1',
    parentId: null,
    name: 'Folder 1',
    slug: 'folder-1',
    createdAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(folders: Map<string, FolderEntity>) {
  const repo: jest.Mocked<FolderRepositoryPort> = {
    findById: jest.fn((id: string) => Promise.resolve(folders.get(id) ?? null)),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    move: jest.fn((id: string, parentId: string | null) =>
      Promise.resolve(buildFolder({ id, parentId })),
    ),
    delete: jest.fn(),
    hasChildren: jest.fn(),
    countAssets: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new MoveFolderUseCase(repo, auditLog), repo };
}

describe('MoveFolderUseCase', () => {
  it('rejects moving a folder under itself', async () => {
    const root = buildFolder({ id: 'root' });
    const { useCase } = buildUseCase(new Map([['root', root]]));

    await expect(
      useCase.execute({ id: 'root', parentId: 'root', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(FolderCycleError);
  });

  it('rejects moving a folder under its own descendant', async () => {
    const root = buildFolder({ id: 'root', parentId: null });
    const child = buildFolder({ id: 'child', parentId: 'root' });
    const { useCase } = buildUseCase(
      new Map([
        ['root', root],
        ['child', child],
      ]),
    );

    await expect(
      useCase.execute({ id: 'root', parentId: 'child', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(FolderCycleError);
  });

  it('rejects moving to a parent that does not exist', async () => {
    const root = buildFolder({ id: 'root' });
    const { useCase } = buildUseCase(new Map([['root', root]]));

    await expect(
      useCase.execute({ id: 'root', parentId: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(FolderNotFoundError);
  });

  it('allows moving to an unrelated folder', async () => {
    const root = buildFolder({ id: 'root', parentId: null });
    const other = buildFolder({ id: 'other', parentId: null });
    const { useCase, repo } = buildUseCase(
      new Map([
        ['root', root],
        ['other', other],
      ]),
    );

    await useCase.execute({
      id: 'root',
      parentId: 'other',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(repo.move).toHaveBeenCalledWith('root', 'other');
  });
});
