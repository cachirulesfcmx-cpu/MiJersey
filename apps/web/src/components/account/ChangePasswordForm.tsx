'use client';

import { Button, FormField, Input } from '@mijersey/ui';
import { useState } from 'react';

export function ChangePasswordForm({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSuccess(false);
    await onSubmit(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setSuccess(true);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <FormField label="Contraseña actual" htmlFor="currentPassword">
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </FormField>
      <FormField label="Nueva contraseña" htmlFor="newPassword">
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </FormField>

      {success && <p className="text-sm text-green-600">Contraseña actualizada.</p>}

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Cambiar contraseña
      </Button>
    </form>
  );
}
