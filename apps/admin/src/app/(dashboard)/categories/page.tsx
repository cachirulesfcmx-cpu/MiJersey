'use client';

import type { Category, CategoryTreeNode } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog } from '@mijersey/ui';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

export default function CategoriesPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [tree, setTree] = useState<CategoryTreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const loadTree = useCallback(async () => {
    if (!accessToken) return;

    try {
      setTree(await client.getCategoryTree(accessToken));
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo cargar el árbol de categorías.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  async function handleReorder(
    parentId: string | null,
    siblings: CategoryTreeNode[],
    index: number,
    direction: -1 | 1,
  ) {
    if (!accessToken) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= siblings.length) return;

    const orderedIds = siblings.map((node) => node.id);
    const swap = orderedIds[index]!;
    orderedIds[index] = orderedIds[newIndex]!;
    orderedIds[newIndex] = swap;

    await client.reorderCategories(accessToken, parentId, orderedIds);
    await loadTree();
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsConfirming(true);
    setError(null);

    try {
      await client.deleteCategory(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadTree();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la categoría.');
    } finally {
      setIsConfirming(false);
    }
  }

  function renderNodes(nodes: CategoryTreeNode[], parentId: string | null, depth: number) {
    return nodes.map((node, index) => (
      <Fragment key={node.id}>
        <div
          style={{ paddingLeft: depth * 24 }}
          className="flex items-center justify-between border-b border-neutral-100 py-2 pr-2"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">{node.name}</span>
            <span className="text-xs text-neutral-400">{node.slug}</span>
            {node.status === 'HIDDEN' && <span className="text-xs text-neutral-400">(oculta)</span>}
          </div>

          {canManage && (
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                disabled={index === 0}
                className="disabled:opacity-30"
                onClick={() => void handleReorder(parentId, nodes, index, -1)}
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === nodes.length - 1}
                className="disabled:opacity-30"
                onClick={() => void handleReorder(parentId, nodes, index, 1)}
              >
                ▼
              </button>
              <Link href={`/categories/${node.id}`} className="text-brand-600 hover:underline">
                Editar
              </Link>
              <Link
                href={`/categories/new?parentId=${node.id}`}
                className="text-neutral-500 hover:underline"
              >
                + Subcategoría
              </Link>
              <button
                type="button"
                className="text-danger-600 hover:underline"
                onClick={() => setPendingDelete(node)}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
        {node.children.length > 0 && renderNodes(node.children, node.id, depth + 1)}
      </Fragment>
    ));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Categorías</h1>
        {canManage && (
          <Link href="/categories/new">
            <Button>Nueva categoría</Button>
          </Link>
        )}
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {!tree && <p className="text-sm text-neutral-500">Cargando…</p>}

      {tree && tree.length === 0 && (
        <p className="text-sm text-neutral-500">Sin categorías todavía.</p>
      )}

      {tree && tree.length > 0 && (
        <div className="rounded-lg border border-neutral-200">{renderNodes(tree, null, 0)}</div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar categoría"
        description={`"${pendingDelete?.name ?? ''}" se eliminará. Si tiene subcategorías, primero deberás moverlas o eliminarlas.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
