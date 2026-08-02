'use client';

import type { NotificationChannel, NotificationPreference } from '@mijersey/sdk';

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: 'Correo electrónico',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  PUSH: 'Notificaciones push',
};

/** Preferences Manager (034 §6/§7 `PATCH /notifications/preferences`) — un canal sin fila explícita llega ya sintetizado como habilitado (`GetNotificationPreferencesUseCase`), así que este componente siempre recibe los cuatro canales completos. */
export function NotificationPreferences({
  preferences,
  isSaving,
  onToggle,
}: {
  preferences: NotificationPreference[] | null;
  isSaving: boolean;
  onToggle: (channel: NotificationChannel, enabled: boolean) => void;
}) {
  if (!preferences) {
    return <p className="text-sm text-neutral-500">Cargando preferencias…</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {preferences.map((preference) => (
        <li
          key={preference.channel}
          className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
        >
          <span className="text-neutral-900">{CHANNEL_LABELS[preference.channel]}</span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preference.enabled}
              disabled={isSaving}
              onChange={(event) => onToggle(preference.channel, event.target.checked)}
            />
            <span className="text-neutral-500">
              {preference.enabled ? 'Activado' : 'Desactivado'}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
