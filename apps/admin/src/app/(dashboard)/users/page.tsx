'use client';

import type { RoleName, StaffMember } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input, Pagination } from '@mijersey/ui';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 10;
const ASSIGNABLE_ROLES: RoleName[] = ['ADMIN', 'EDITOR', 'SUPPORT'];
const ALL_ROLES: RoleName[] = ['SUPER_ADMIN', ...ASSIGNABLE_ROLES];

interface CreateForm {
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
}

const EMPTY_FORM: CreateForm = { email: '', firstName: '', lastName: '', role: 'SUPPORT' };

export default function UsersPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('identity:manage');

  const [users, setUsers] = useState<StaffMember[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [pendingDeactivation, setPendingDeactivation] = useState<StaffMember | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listStaffUsers(accessToken, { page, pageSize: PAGE_SIZE });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los usuarios.');
    }
  }, [client, accessToken, page]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setCreateError(null);
    setIsCreating(true);

    try {
      await client.createStaffUser(accessToken, createForm);
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      await loadUsers();
    } catch (err) {
      setCreateError(err instanceof ApiClientError ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRoleChange(target: StaffMember, role: RoleName) {
    if (!accessToken) return;
    await client.updateStaffUserRole(accessToken, target.id, role);
    await loadUsers();
  }

  async function handleConfirmDeactivate() {
    if (!accessToken || !pendingDeactivation) return;
    setIsConfirming(true);

    try {
      await client.setStaffUserActive(accessToken, pendingDeactivation.id, false);
      setPendingDeactivation(null);
      await loadUsers();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Usuarios administradores</h1>
        {canManage && <Button onClick={() => setIsCreateOpen(true)}>Invitar usuario</Button>}
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<StaffMember>
        isLoading={!users}
        rows={users ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin usuarios de staff todavía"
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => `${row.firstName} ${row.lastName}` },
          { key: 'email', header: 'Correo', render: (row) => row.email },
          {
            key: 'role',
            header: 'Rol',
            render: (row) =>
              canManage ? (
                <select
                  className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
                  value={row.role}
                  onChange={(event) => void handleRoleChange(row, event.target.value as RoleName)}
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                row.role
              ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              canManage ? (
                <Button variant="ghost" onClick={() => setPendingDeactivation(row)}>
                  Desactivar
                </Button>
              ) : null,
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={pendingDeactivation !== null}
        title="Desactivar usuario"
        description={`Esto revocará todas las sesiones activas de ${pendingDeactivation?.firstName ?? ''}.`}
        confirmLabel="Desactivar"
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDeactivate()}
        onCancel={() => setPendingDeactivation(null)}
      />

      {isCreateOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Invitar usuario</h2>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <FormField label="Nombre" htmlFor="firstName">
                <Input
                  required
                  value={createForm.firstName}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                />
              </FormField>

              <FormField label="Apellido" htmlFor="lastName">
                <Input
                  required
                  value={createForm.lastName}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                />
              </FormField>

              <FormField label="Correo electrónico" htmlFor="email">
                <Input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </FormField>

              <FormField label="Rol" htmlFor="role">
                <select
                  id="role"
                  className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, role: event.target.value as RoleName }))
                  }
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </FormField>

              {createError && <p className="text-danger-600 text-sm">{createError}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isCreating}>
                  Invitar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
