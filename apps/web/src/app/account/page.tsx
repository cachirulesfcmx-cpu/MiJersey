'use client';

import type {
  Address,
  CreateAddressInput,
  CustomerOrderSummary,
  MyAccount,
  NotificationChannel,
  NotificationPreference,
  SessionSummary,
} from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, Skeleton } from '@mijersey/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AddressBook } from '../../components/account/AddressBook';
import { ChangePasswordForm } from '../../components/account/ChangePasswordForm';
import { NotificationPreferences } from '../../components/account/NotificationPreferences';
import { OrderHistory } from '../../components/account/OrderHistory';
import { ProfileForm, type ProfileFormValue } from '../../components/account/ProfileForm';
import { Reveal } from '../../components/ui/Reveal';
import { env } from '../../config/env';
import { useAuth } from '../../providers/auth-provider';

export default function AccountPage() {
  const { user, accessToken, isLoading, logout } = useAuth();
  const router = useRouter();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [account, setAccount] = useState<MyAccount | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [orders, setOrders] = useState<CustomerOrderSummary[] | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [notificationPreferences, setNotificationPreferences] = useState<
    NotificationPreference[] | null
  >(null);
  const [isSavingNotificationPreferences, setIsSavingNotificationPreferences] = useState(false);
  const [notificationPreferencesError, setNotificationPreferencesError] = useState<string | null>(
    null,
  );

  const loadAccount = useCallback(async () => {
    if (!accessToken) return;
    try {
      setAccount(await client.getMyAccount(accessToken));
    } catch (err) {
      setProfileError(err instanceof ApiClientError ? err.message : 'No se pudo cargar tu perfil.');
    }
  }, [client, accessToken]);

  const loadAddresses = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listMyAddresses(accessToken);
      setAddresses(result.items);
    } catch (err) {
      setAddressError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar tus direcciones.',
      );
    }
  }, [client, accessToken]);

  const loadOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listMyOrders(accessToken, { page: 1, pageSize: 10 });
      setOrders(result.items);
    } catch {
      setOrders([]);
    }
  }, [client, accessToken]);

  const loadSessions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listSessions(accessToken);
      setSessions(result);
    } catch (err) {
      setSessionsError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las sesiones.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  const loadNotificationPreferences = useCallback(async () => {
    if (!accessToken) return;
    try {
      setNotificationPreferences(await client.getMyNotificationPreferences(accessToken));
    } catch (err) {
      setNotificationPreferencesError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudieron cargar tus preferencias de notificación.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void loadAccount();
    void loadAddresses();
    void loadOrders();
    void loadSessions();
    void loadNotificationPreferences();
  }, [loadAccount, loadAddresses, loadOrders, loadSessions, loadNotificationPreferences]);

  async function handleProfileSubmit(value: ProfileFormValue) {
    if (!accessToken) return;
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await client.updateMyAccount(accessToken, {
        firstName: value.firstName,
        lastName: value.lastName,
        ...(value.phone ? { phone: value.phone } : {}),
        preferences: { marketingEmailsOptIn: value.marketingEmailsOptIn },
      });
      setAccount(updated);
    } catch (err) {
      setProfileError(
        err instanceof ApiClientError ? err.message : 'No se pudo guardar el perfil.',
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleCreateAddress(input: CreateAddressInput) {
    if (!accessToken) return;
    setIsSavingAddress(true);
    setAddressError(null);
    try {
      await client.createMyAddress(accessToken, input);
      await loadAddresses();
    } catch (err) {
      setAddressError(
        err instanceof ApiClientError ? err.message : 'No se pudo guardar la dirección.',
      );
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleSetDefaultAddress(address: Address) {
    if (!accessToken) return;
    try {
      await client.updateMyAddress(accessToken, address.id, { isDefault: true });
      await loadAddresses();
    } catch (err) {
      setAddressError(
        err instanceof ApiClientError ? err.message : 'No se pudo actualizar la dirección.',
      );
    }
  }

  async function handleDeleteAddress(address: Address) {
    if (!accessToken) return;
    try {
      await client.deleteMyAddress(accessToken, address.id);
      await loadAddresses();
    } catch (err) {
      setAddressError(
        err instanceof ApiClientError ? err.message : 'No se pudo eliminar la dirección.',
      );
    }
  }

  async function handleChangePassword(currentPassword: string, newPassword: string) {
    if (!accessToken) return;
    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await client.changePassword(accessToken, { currentPassword, newPassword });
    } catch (err) {
      setPasswordError(
        err instanceof ApiClientError ? err.message : 'No se pudo cambiar la contraseña.',
      );
      throw err;
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleRevoke(sessionId: string) {
    if (!accessToken) return;
    await client.revokeSession(accessToken, sessionId);
    await loadSessions();
  }

  async function handleRevokeAll() {
    if (!accessToken) return;
    await client.revokeAllSessions(accessToken);
    await loadSessions();
  }

  async function handleToggleNotificationPreference(
    channel: NotificationChannel,
    enabled: boolean,
  ) {
    if (!accessToken) return;
    setIsSavingNotificationPreferences(true);
    setNotificationPreferencesError(null);
    try {
      const updated = await client.updateMyNotificationPreferences(accessToken, {
        updates: [{ channel, enabled }],
      });
      setNotificationPreferences(updated);
    } catch (err) {
      setNotificationPreferencesError(
        err instanceof ApiClientError ? err.message : 'No se pudo actualizar la preferencia.',
      );
    } finally {
      setIsSavingNotificationPreferences(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
        <Skeleton className="skeleton-arena h-8 w-48" />
        <Skeleton className="skeleton-arena h-24 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="section-heading">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
          {!user.isEmailVerified && (
            <p className="text-warning-600 mt-1 text-xs">Tu correo aún no está verificado.</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/wishlist" className="link-underline text-sm">
            Mi lista de deseos
          </Link>
          <Link href="/account/support" className="link-underline text-sm">
            Mis tickets
          </Link>
          <Button variant="secondary" onClick={handleLogout} className="!rounded-full">
            Cerrar sesión
          </Button>
        </div>
      </Reveal>

      <Reveal className="flex flex-col gap-4">
        <h2 className="section-heading text-xl">Perfil</h2>
        {profileError && <p className="text-danger-600 text-sm">{profileError}</p>}
        {account ? (
          <ProfileForm
            account={account}
            isSubmitting={isSavingProfile}
            onSubmit={handleProfileSubmit}
          />
        ) : (
          <Skeleton className="skeleton-arena h-40 w-full" />
        )}
      </Reveal>

      <Reveal className="flex flex-col gap-4">
        <h2 className="section-heading text-xl">Direcciones</h2>
        {addressError && <p className="text-danger-600 text-sm">{addressError}</p>}
        {addresses ? (
          <AddressBook
            addresses={addresses}
            isSubmitting={isSavingAddress}
            onCreate={handleCreateAddress}
            onSetDefault={handleSetDefaultAddress}
            onDelete={handleDeleteAddress}
          />
        ) : (
          <Skeleton className="skeleton-arena h-24 w-full" />
        )}
      </Reveal>

      <Reveal className="flex flex-col gap-4">
        <h2 className="section-heading text-xl">Pedidos</h2>
        <OrderHistory orders={orders} />
      </Reveal>

      <Reveal className="flex flex-col gap-4">
        <h2 className="section-heading text-xl">Seguridad</h2>
        {passwordError && <p className="text-danger-600 text-sm">{passwordError}</p>}
        <ChangePasswordForm isSubmitting={isChangingPassword} onSubmit={handleChangePassword} />
      </Reveal>

      <Reveal className="flex flex-col gap-4">
        <h2 className="section-heading text-xl">Notificaciones</h2>
        {notificationPreferencesError && (
          <p className="text-danger-600 text-sm">{notificationPreferencesError}</p>
        )}
        <NotificationPreferences
          preferences={notificationPreferences}
          isSaving={isSavingNotificationPreferences}
          onToggle={(channel, enabled) => void handleToggleNotificationPreference(channel, enabled)}
        />
      </Reveal>

      <Reveal className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="section-heading text-xl">Sesiones activas</h2>
          <button type="button" onClick={handleRevokeAll} className="link-underline text-sm">
            Cerrar todas las demás
          </button>
        </div>

        {sessionsError && <p className="text-danger-600 text-sm">{sessionsError}</p>}

        {!sessions && !sessionsError && (
          <div className="flex flex-col gap-2">
            <Skeleton className="skeleton-arena h-14 w-full" />
            <Skeleton className="skeleton-arena h-14 w-full" />
          </div>
        )}

        {sessions && sessions.length === 0 && (
          <p className="text-sm text-neutral-500">No hay sesiones activas.</p>
        )}

        <ul className="flex flex-col gap-2">
          {sessions?.map((session) => (
            <li key={session.id} className="card-arena flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-neutral-900">
                  {session.userAgent ?? 'Dispositivo desconocido'}
                  {session.isCurrent && <span className="badge-pop ml-2">Esta sesión</span>}
                </p>
                <p className="text-xs text-neutral-500">
                  Último uso: {new Date(session.lastUsedAt).toLocaleString('es-MX')}
                </p>
              </div>
              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevoke(session.id)}
                  className="link-underline text-danger-600 text-sm"
                >
                  Revocar
                </button>
              )}
            </li>
          ))}
        </ul>
      </Reveal>
    </main>
  );
}
