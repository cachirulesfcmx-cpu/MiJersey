'use client';

import type {
  NavigationItem,
  NavigationItemInput,
  NavigationItemType,
  NavigationMenu,
  NavigationMenuStatus,
  NavigationVersion,
} from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const ITEM_TYPES: NavigationItemType[] = [
  'LINK',
  'CATEGORY',
  'COLLECTION',
  'BRAND',
  'PRODUCT',
  'PAGE',
];
const DEVICES = ['desktop', 'mobile'];

interface ItemRow {
  tempId: string;
  parentTempId: string;
  label: string;
  type: NavigationItemType;
  target: string;
  icon: string;
  sortOrder: number;
  openInNewTab: boolean;
  authenticated: '' | 'true' | 'false';
  devices: string[];
}

let tempIdCounter = 0;
function nextTempId(): string {
  tempIdCounter += 1;
  return `new-${tempIdCounter}`;
}

function toRows(items: NavigationItem[]): ItemRow[] {
  return items.map((item) => ({
    tempId: item.id,
    parentTempId: item.parentId ?? '',
    label: item.label,
    type: item.type,
    target: item.target,
    icon: item.icon ?? '',
    sortOrder: item.sortOrder,
    openInNewTab: item.openInNewTab,
    authenticated:
      item.visibilityRules?.authenticated === undefined
        ? ''
        : item.visibilityRules.authenticated
          ? 'true'
          : 'false',
    devices: item.visibilityRules?.devices ?? [],
  }));
}

function toItemInputs(rows: ItemRow[]): NavigationItemInput[] {
  return rows.map((row) => ({
    tempId: row.tempId,
    parentTempId: row.parentTempId || null,
    label: row.label,
    type: row.type,
    target: row.target,
    icon: row.icon || null,
    sortOrder: row.sortOrder,
    openInNewTab: row.openInNewTab,
    visibilityRules:
      row.authenticated === '' && row.devices.length === 0
        ? null
        : {
            ...(row.authenticated !== '' ? { authenticated: row.authenticated === 'true' } : {}),
            ...(row.devices.length > 0 ? { devices: row.devices } : {}),
          },
  }));
}

interface PreviewNode {
  tempId: string;
  label: string;
  type: NavigationItemType;
  target: string;
  children: PreviewNode[];
}

function buildPreviewTree(rows: ItemRow[]): PreviewNode[] {
  const byParent = new Map<string, ItemRow[]>();
  for (const row of rows) {
    const key = row.parentTempId || '';
    byParent.set(key, [...(byParent.get(key) ?? []), row]);
  }
  function build(parentKey: string): PreviewNode[] {
    return (byParent.get(parentKey) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        tempId: row.tempId,
        label: row.label,
        type: row.type,
        target: row.target,
        children: build(row.tempId),
      }));
  }
  return build('');
}

function PreviewList({ nodes }: { nodes: PreviewNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 border-l border-neutral-200 pl-4">
      {nodes.map((node) => (
        <li key={node.tempId} className="text-sm">
          <span className="font-medium text-neutral-900">{node.label}</span>{' '}
          <span className="text-xs text-neutral-500">
            ({node.type}: {node.target})
          </span>
          <PreviewList nodes={node.children} />
        </li>
      ))}
    </ul>
  );
}

/** Navigation Builder — Tree Editor + Link Picker + Visibility Rules Editor + Live Preview (spec 028 §6). El árbol se edita como lista plana con un selector de padre (compensación deliberada frente a drag & drop real, dado el alcance de este sprint) y `sortOrder` numérico para el orden entre hermanos. */
export default function EditNavigationMenuPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [menu, setMenu] = useState<NavigationMenu | null>(null);
  const [versions, setVersions] = useState<NavigationVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<NavigationMenuStatus>('DRAFT');
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [menuResult, versionsResult] = await Promise.all([
        client.getNavigationMenu(accessToken, params.id),
        client.listNavigationMenuVersions(accessToken, params.id, { pageSize: 50 }),
      ]);
      setMenu(menuResult);
      setVersions(versionsResult.items);
      setName(menuResult.name);
      setLocation(menuResult.location);
      setStatus(menuResult.status);
      setRows(toRows(menuResult.items));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el menú.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        tempId: nextTempId(),
        parentTempId: '',
        label: 'Nuevo ítem',
        type: 'LINK',
        target: '/',
        icon: '',
        sortOrder: prev.length,
        openInNewTab: false,
        authenticated: '',
        devices: [],
      },
    ]);
  }

  function removeRow(tempId: string) {
    setRows((prev) => prev.filter((row) => row.tempId !== tempId && row.parentTempId !== tempId));
  }

  function updateRow(tempId: string, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((row) => (row.tempId === tempId ? { ...row, ...patch } : row)));
  }

  function toggleDevice(tempId: string, device: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId
          ? {
              ...row,
              devices: row.devices.includes(device)
                ? row.devices.filter((d) => d !== device)
                : [...row.devices, device],
            }
          : row,
      ),
    );
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.updateNavigationMenu(accessToken, params.id, {
        name,
        location,
        status,
        items: toItemInputs(rows),
      });
      setSuccessMessage('Cambios guardados.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el menú.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRestore(versionNumber: number) {
    if (!accessToken) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await client.restoreNavigationMenuVersion(accessToken, params.id, versionNumber);
      setSuccessMessage(`Versión ${versionNumber} restaurada.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo restaurar la versión.');
    }
  }

  if (!menu) return <p className="text-sm text-neutral-500">Cargando…</p>;

  const previewTree = buildPreviewTree(rows);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{menu.name}</h1>
        <p className="text-sm text-neutral-500">
          Ubicación: {menu.location} · Estado: {menu.status}
        </p>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {successMessage && <p className="text-success-600 text-sm">{successMessage}</p>}

      <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Nombre" htmlFor="edit-name">
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Ubicación" htmlFor="edit-location">
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </FormField>
          <FormField label="Estado" htmlFor="edit-status">
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as NavigationMenuStatus)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </FormField>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Ítems (Tree Editor)</h2>
            <Button type="button" variant="secondary" onClick={addRow}>
              + Agregar ítem
            </Button>
          </div>

          {rows.length === 0 && <p className="text-sm text-neutral-500">Sin ítems todavía.</p>}

          {rows.map((row) => (
            <div
              key={row.tempId}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3"
            >
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <FormField label="Etiqueta" htmlFor={`label-${row.tempId}`}>
                  <Input
                    id={`label-${row.tempId}`}
                    value={row.label}
                    onChange={(e) => updateRow(row.tempId, { label: e.target.value })}
                  />
                </FormField>
                <FormField label="Padre" htmlFor={`parent-${row.tempId}`}>
                  <select
                    id={`parent-${row.tempId}`}
                    value={row.parentTempId}
                    onChange={(e) => updateRow(row.tempId, { parentTempId: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
                  >
                    <option value="">— Nivel raíz —</option>
                    {rows
                      .filter((candidate) => candidate.tempId !== row.tempId)
                      .map((candidate) => (
                        <option key={candidate.tempId} value={candidate.tempId}>
                          {candidate.label}
                        </option>
                      ))}
                  </select>
                </FormField>
                <FormField label="Orden" htmlFor={`sort-${row.tempId}`}>
                  <Input
                    id={`sort-${row.tempId}`}
                    type="number"
                    value={row.sortOrder}
                    onChange={(e) => updateRow(row.tempId, { sortOrder: Number(e.target.value) })}
                  />
                </FormField>
                <FormField label="Icono (opcional)" htmlFor={`icon-${row.tempId}`}>
                  <Input
                    id={`icon-${row.tempId}`}
                    value={row.icon}
                    onChange={(e) => updateRow(row.tempId, { icon: e.target.value })}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <FormField label="Tipo (Link Picker)" htmlFor={`type-${row.tempId}`}>
                  <select
                    id={`type-${row.tempId}`}
                    value={row.type}
                    onChange={(e) =>
                      updateRow(row.tempId, { type: e.target.value as NavigationItemType })
                    }
                    className="w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label={row.type === 'LINK' ? 'URL' : 'Id del recurso'}
                  htmlFor={`target-${row.tempId}`}
                  hint={row.type === 'LINK' ? '/ruta o https://…' : 'Id de la entidad enlazada'}
                >
                  <Input
                    id={`target-${row.tempId}`}
                    value={row.target}
                    onChange={(e) => updateRow(row.tempId, { target: e.target.value })}
                  />
                </FormField>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.openInNewTab}
                    onChange={(e) => updateRow(row.tempId, { openInNewTab: e.target.checked })}
                  />
                  Abrir en pestaña nueva
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(row.tempId)}
                  className="text-danger-600 self-end pb-2 text-xs hover:underline"
                >
                  Quitar (y sus hijos)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 rounded-md bg-neutral-50 p-2">
                <span className="text-xs font-semibold text-neutral-700">
                  Visibilidad por contexto:
                </span>
                <FormField label="Sesión" htmlFor={`auth-${row.tempId}`}>
                  <select
                    id={`auth-${row.tempId}`}
                    value={row.authenticated}
                    onChange={(e) =>
                      updateRow(row.tempId, {
                        authenticated: e.target.value as ItemRow['authenticated'],
                      })
                    }
                    className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  >
                    <option value="">Sin regla</option>
                    <option value="true">Solo autenticados</option>
                    <option value="false">Solo anónimos</option>
                  </select>
                </FormField>
                {DEVICES.map((device) => (
                  <label key={device} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={row.devices.includes(device)}
                      onChange={() => toggleDevice(row.tempId, device)}
                    />
                    {device}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" isLoading={isSaving} className="self-start">
          Guardar cambios
        </Button>
      </form>

      <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Live Preview</h2>
        {previewTree.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin ítems para previsualizar.</p>
        ) : (
          <PreviewList nodes={previewTree} />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Historial de versiones</h2>
        <ul className="flex flex-col gap-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
            >
              <span>
                Versión {version.versionNumber} — {version.snapshot.name} (
                {new Date(version.createdAt).toLocaleString('es-MX')})
              </span>
              <button
                type="button"
                onClick={() => void handleRestore(version.versionNumber)}
                className="text-brand-600 hover:underline"
              >
                Restaurar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
