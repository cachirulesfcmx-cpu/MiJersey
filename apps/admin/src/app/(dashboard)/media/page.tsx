'use client';

import type {
  Folder,
  FolderTreeNode,
  MediaAsset,
  MediaAssetStatus,
  MediaType,
} from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, EmptyState, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';
import { FolderTree } from './FolderTree';
import { MediaEditorPanel } from './MediaEditorPanel';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;

function flattenFolders(nodes: FolderTreeNode[]): Folder[] {
  return nodes.flatMap((node) => [
    {
      id: node.id,
      parentId: node.parentId,
      name: node.name,
      slug: node.slug,
      createdAt: node.createdAt,
    },
    ...flattenFolders(node.children),
  ]);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default function MediaLibraryPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('');
  const [statusFilter, setStatusFilter] = useState<MediaAssetStatus | ''>('');

  const [items, setItems] = useState<MediaAsset[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | 'bulk' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const flatFolders = useMemo(() => flattenFolders(folderTree), [folderTree]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, selectedFolderId]);

  const loadFolders = useCallback(async () => {
    if (!accessToken) return;
    try {
      setFolderTree(await client.listFolders(accessToken));
    } catch {
      setFolderTree([]);
    }
  }, [client, accessToken]);

  const loadMedia = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listMedia(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(selectedFolderId ? { folderId: selectedFolderId } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la biblioteca.');
    }
  }, [client, accessToken, page, search, selectedFolderId, typeFilter, statusFilter]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  async function handleUploadFiles(files: FileList | File[]) {
    if (!accessToken) return;
    setIsUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        await client.uploadMedia(accessToken, {
          file,
          ...(selectedFolderId ? { folderId: selectedFolderId } : {}),
        });
      }
      await loadMedia();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo subir el archivo.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCreateFolder(name: string, parentId: string | null) {
    if (!accessToken) return;
    try {
      await client.createFolder(accessToken, { name, ...(parentId ? { parentId } : {}) });
      await loadFolders();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la carpeta.');
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!accessToken) return;
    try {
      await client.deleteFolder(accessToken, folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      await loadFolders();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la carpeta.');
    }
  }

  async function handleSaveMetadata(updates: Parameters<typeof client.updateMedia>[2]) {
    if (!accessToken || !editingAsset) return;
    setIsSaving(true);
    try {
      const updated = await client.updateMedia(accessToken, editingAsset.id, updates);
      setEditingAsset(updated);
      await loadMedia();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el archivo.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken || !deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget === 'bulk') {
        for (const id of selectedIds) {
          await client.deleteMedia(accessToken, id);
        }
        setSelectedIds(new Set());
      } else {
        await client.deleteMedia(accessToken, deleteTarget.id);
        if (editingAsset?.id === deleteTarget.id) setEditingAsset(null);
      }
      await loadMedia();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el archivo.');
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Media Library</h1>
        {canManage && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) void handleUploadFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()} isLoading={isUploading}>
              Subir archivos
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <FolderTree
            folders={folderTree}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onCreate={handleCreateFolder}
            onDelete={handleDeleteFolder}
            canManage={canManage}
          />
        </div>

        <div
          className={`flex flex-1 flex-col gap-4 rounded-lg ${
            isDragging ? 'bg-brand-50 outline-brand-300 outline-dashed outline-2' : ''
          }`}
          onDragOver={(event) => {
            if (!canManage) return;
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (canManage && event.dataTransfer.files.length) {
              void handleUploadFiles(event.dataTransfer.files);
            }
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder="Buscar por nombre o título"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-64 rounded-md border border-neutral-200 px-3 py-2 text-sm"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as MediaType | '')}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="IMAGE">Imágenes</option>
              <option value="VIDEO">Videos</option>
              <option value="DOCUMENT">Documentos</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MediaAssetStatus | '')}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="ARCHIVED">Archivados</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              {canManage && selectedIds.size > 0 && (
                <Button variant="danger" onClick={() => setDeleteTarget('bulk')}>
                  Eliminar ({selectedIds.size})
                </Button>
              )}
              <div className="flex overflow-hidden rounded-md border border-neutral-200 text-sm">
                <button
                  type="button"
                  className={`px-3 py-1.5 ${view === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-neutral-600'}`}
                  onClick={() => setView('grid')}
                >
                  Cuadrícula
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-neutral-600'}`}
                  onClick={() => setView('list')}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>

          {!items || items.length === 0 ? (
            <EmptyState
              title="Sin archivos todavía"
              description="Arrastra archivos aquí o usa el botón «Subir archivos»."
            />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((asset) => (
                <div
                  key={asset.id}
                  className={`group relative flex flex-col gap-2 rounded-lg border p-2 ${
                    selectedIds.has(asset.id) ? 'border-brand-400' : 'border-neutral-200'
                  }`}
                >
                  <label className="absolute left-2 top-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(asset.id)}
                      onChange={() => toggleSelected(asset.id)}
                    />
                  </label>
                  <button
                    type="button"
                    className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-neutral-50"
                    onClick={() => setEditingAsset(asset)}
                  >
                    {asset.type === 'IMAGE' ? (
                      <img
                        src={asset.thumbnailUrl ?? asset.url}
                        alt={asset.altText ?? asset.originalName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-neutral-400">{asset.type}</span>
                    )}
                  </button>
                  <p className="truncate text-xs text-neutral-700" title={asset.originalName}>
                    {asset.originalName}
                  </p>
                  <p className="text-[11px] text-neutral-400">{formatBytes(asset.size)}</p>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="w-8 py-2" />
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Tamaño</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((asset) => (
                  <tr key={asset.id} className="border-b border-neutral-100">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(asset.id)}
                        onChange={() => toggleSelected(asset.id)}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-brand-600 hover:underline"
                        onClick={() => setEditingAsset(asset)}
                      >
                        {asset.title || asset.originalName}
                      </button>
                    </td>
                    <td className="py-2 text-neutral-500">{asset.type}</td>
                    <td className="py-2 text-neutral-500">{formatBytes(asset.size)}</td>
                    <td className="py-2 text-neutral-500">
                      {asset.status === 'ACTIVE' ? 'Activo' : 'Archivado'}
                    </td>
                    <td className="py-2 text-right">
                      {canManage && (
                        <button
                          type="button"
                          className="text-danger-600 text-xs hover:underline"
                          onClick={() => setDeleteTarget(asset)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>

        {editingAsset && (
          <MediaEditorPanel
            asset={editingAsset}
            folders={flatFolders}
            canManage={canManage}
            isSaving={isSaving}
            onSave={handleSaveMetadata}
            onClose={() => setEditingAsset(null)}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={
          deleteTarget === 'bulk' ? `Eliminar ${selectedIds.size} archivos` : 'Eliminar archivo'
        }
        description="Esta acción no se puede deshacer. Si el archivo está en uso en otro módulo, no podrá eliminarse."
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
