'use client';

import type { FolderTreeNode } from '@mijersey/sdk';
import { Button, Input } from '@mijersey/ui';
import { useState } from 'react';

interface FolderTreeProps {
  folders: FolderTreeNode[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreate: (name: string, parentId: string | null) => Promise<void>;
  onDelete: (folderId: string) => Promise<void>;
  canManage: boolean;
}

function FolderNode({
  node,
  depth,
  selectedFolderId,
  onSelect,
  onCreate,
  onDelete,
  canManage,
}: {
  node: FolderTreeNode;
  depth: number;
} & Omit<FolderTreeProps, 'folders'>) {
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [childName, setChildName] = useState('');

  return (
    <li>
      <div
        className={`group flex items-center justify-between rounded-md px-2 py-1 text-sm ${
          selectedFolderId === node.id
            ? 'bg-brand-50 text-brand-700'
            : 'text-neutral-700 hover:bg-neutral-100'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <button
          type="button"
          className="flex-1 truncate text-left"
          onClick={() => onSelect(node.id)}
        >
          {node.name}
        </button>
        {canManage && (
          <div className="hidden gap-1 group-hover:flex">
            <button
              type="button"
              title="Nueva subcarpeta"
              className="text-neutral-400 hover:text-neutral-900"
              onClick={() => setIsCreatingChild((prev) => !prev)}
            >
              +
            </button>
            <button
              type="button"
              title="Eliminar carpeta"
              className="hover:text-danger-600 text-neutral-400"
              onClick={() => void onDelete(node.id)}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {isCreatingChild && (
        <form
          className="flex gap-1 px-2 py-1"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onSubmit={(event) => {
            event.preventDefault();
            if (!childName.trim()) return;
            void onCreate(childName.trim(), node.id).then(() => {
              setChildName('');
              setIsCreatingChild(false);
            });
          }}
        >
          <Input
            autoFocus
            value={childName}
            onChange={(event) => setChildName(event.target.value)}
            placeholder="Nombre"
            className="h-7 text-xs"
          />
          <Button type="submit" variant="secondary" className="h-7 px-2 text-xs">
            Crear
          </Button>
        </form>
      )}

      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              canManage={canManage}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelect,
  onCreate,
  onDelete,
  canManage,
}: FolderTreeProps) {
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [rootName, setRootName] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-neutral-500">Carpetas</span>
        {canManage && (
          <button
            type="button"
            className="text-brand-600 text-xs hover:underline"
            onClick={() => setIsCreatingRoot((prev) => !prev)}
          >
            + Nueva
          </button>
        )}
      </div>

      <button
        type="button"
        className={`rounded-md px-2 py-1 text-left text-sm ${
          selectedFolderId === null
            ? 'bg-brand-50 text-brand-700'
            : 'text-neutral-700 hover:bg-neutral-100'
        }`}
        onClick={() => onSelect(null)}
      >
        Todos los archivos
      </button>

      {isCreatingRoot && (
        <form
          className="flex gap-1 px-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!rootName.trim()) return;
            void onCreate(rootName.trim(), null).then(() => {
              setRootName('');
              setIsCreatingRoot(false);
            });
          }}
        >
          <Input
            autoFocus
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            placeholder="Nombre"
            className="h-7 text-xs"
          />
          <Button type="submit" variant="secondary" className="h-7 px-2 text-xs">
            Crear
          </Button>
        </form>
      )}

      <ul className="flex flex-col gap-0.5">
        {folders.map((node) => (
          <FolderNode
            key={node.id}
            node={node}
            depth={0}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            onCreate={onCreate}
            onDelete={onDelete}
            canManage={canManage}
          />
        ))}
      </ul>
    </div>
  );
}
