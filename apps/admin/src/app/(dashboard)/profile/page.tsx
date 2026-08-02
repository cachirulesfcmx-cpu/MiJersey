'use client';

import type { EnrollMfaResult, SessionSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

export default function ProfilePage() {
  const { user, accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled ?? false);
  const [enrollment, setEnrollment] = useState<EnrollMfaResult | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!accessToken) return;

    try {
      setSessions(await client.listSessions(accessToken));
    } catch (err) {
      setSessionsError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las sesiones.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      await client.updateProfile(accessToken, profileForm);
      setProfileMessage('Datos actualizados.');
    } catch (err) {
      setProfileError(
        err instanceof ApiClientError ? err.message : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setPasswordError(null);
    setPasswordMessage(null);
    setIsChangingPassword(true);

    try {
      await client.changePassword(accessToken, passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setPasswordMessage('Contraseña actualizada. Se cerraron tus otras sesiones.');
      await loadSessions();
    } catch (err) {
      setPasswordError(
        err instanceof ApiClientError ? err.message : 'No se pudo cambiar la contraseña.',
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!accessToken) return;
    await client.revokeSession(accessToken, sessionId);
    await loadSessions();
  }

  async function handleEnrollMfa() {
    if (!accessToken) return;
    setMfaError(null);
    setMfaMessage(null);
    setIsEnrolling(true);

    try {
      setEnrollment(await client.enrollMfa(accessToken));
    } catch (err) {
      setMfaError(
        err instanceof ApiClientError ? err.message : 'No se pudo iniciar el enrolamiento.',
      );
    } finally {
      setIsEnrolling(false);
    }
  }

  async function handleConfirmMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setMfaError(null);
    setIsConfirming(true);

    try {
      await client.confirmMfa(accessToken, { code: confirmCode });
      setMfaEnabled(true);
      setEnrollment(null);
      setConfirmCode('');
      setMfaMessage('Autenticación en dos pasos activada.');
    } catch (err) {
      setMfaError(err instanceof ApiClientError ? err.message : 'Código de verificación inválido.');
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleDisableMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setMfaError(null);
    setIsDisabling(true);

    try {
      await client.disableMfa(accessToken, { code: disableCode });
      setMfaEnabled(false);
      setDisableCode('');
      setMfaMessage('Autenticación en dos pasos desactivada.');
    } catch (err) {
      setMfaError(err instanceof ApiClientError ? err.message : 'Código de verificación inválido.');
    } finally {
      setIsDisabling(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <h1 className="text-2xl font-semibold text-neutral-900">Perfil</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-neutral-900">Datos básicos</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <FormField label="Nombre" htmlFor="firstName">
            <Input
              required
              value={profileForm.firstName}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Apellido" htmlFor="lastName">
            <Input
              required
              value={profileForm.lastName}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))
              }
            />
          </FormField>

          {profileError && <p className="text-danger-600 text-sm">{profileError}</p>}
          {profileMessage && <p className="text-success-600 text-sm">{profileMessage}</p>}

          <div>
            <Button type="submit" isLoading={isSavingProfile}>
              Guardar
            </Button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-neutral-900">Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <FormField label="Contraseña actual" htmlFor="currentPassword">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Contraseña nueva" htmlFor="newPassword" hint="Mínimo 8 caracteres">
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
            />
          </FormField>

          {passwordError && <p className="text-danger-600 text-sm">{passwordError}</p>}
          {passwordMessage && <p className="text-success-600 text-sm">{passwordMessage}</p>}

          <div>
            <Button type="submit" isLoading={isChangingPassword}>
              Actualizar contraseña
            </Button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-neutral-900">Autenticación en dos pasos (MFA)</h2>

        {mfaError && <p className="text-danger-600 text-sm">{mfaError}</p>}
        {mfaMessage && <p className="text-success-600 text-sm">{mfaMessage}</p>}

        {mfaEnabled ? (
          <form onSubmit={handleDisableMfa} className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Está activada. Ingresa un código actual de tu aplicación de autenticación para
              desactivarla.
            </p>
            <FormField label="Código de verificación" htmlFor="disable-mfa-code">
              <Input
                id="disable-mfa-code"
                inputMode="numeric"
                maxLength={6}
                required
                value={disableCode}
                onChange={(event) => setDisableCode(event.target.value)}
              />
            </FormField>
            <div>
              <Button type="submit" variant="secondary" isLoading={isDisabling}>
                Desactivar
              </Button>
            </div>
          </form>
        ) : enrollment ? (
          <form onSubmit={handleConfirmMfa} className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Escanea este código con tu aplicación de autenticación (Google Authenticator, Authy,
              1Password…) o ingresa la clave manualmente, luego confirma con el código generado.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL generado en el servidor, no un asset optimizable por next/image */}
            <img
              src={enrollment.qrCodeDataUrl}
              alt="Código QR para MFA"
              width={200}
              height={200}
              className="rounded-md border border-neutral-200"
            />
            <p className="break-all font-mono text-xs text-neutral-500">{enrollment.secret}</p>
            <FormField label="Código de verificación" htmlFor="confirm-mfa-code">
              <Input
                id="confirm-mfa-code"
                inputMode="numeric"
                maxLength={6}
                required
                value={confirmCode}
                onChange={(event) => setConfirmCode(event.target.value)}
              />
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" isLoading={isConfirming}>
                Confirmar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEnrollment(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600">
              Está desactivada. Actívala para proteger tu cuenta con un segundo factor.
            </p>
            <div>
              <Button onClick={() => void handleEnrollMfa()} isLoading={isEnrolling}>
                Activar
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-neutral-900">Sesiones activas</h2>

        {sessionsError && <p className="text-danger-600 text-sm">{sessionsError}</p>}

        <ul className="flex flex-col gap-2">
          {sessions?.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
            >
              <div>
                <p className="font-medium text-neutral-900">
                  {session.userAgent ?? 'Dispositivo desconocido'}
                  {session.isCurrent && (
                    <span className="text-brand-600 ml-2 text-xs">(esta sesión)</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500">
                  Último uso: {new Date(session.lastUsedAt).toLocaleString('es-MX')}
                </p>
              </div>
              {!session.isCurrent && (
                <Button variant="ghost" onClick={() => void handleRevokeSession(session.id)}>
                  Revocar
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
