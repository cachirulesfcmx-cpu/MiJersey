'use client';

import type { MyAccount } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useState } from 'react';

export interface ProfileFormValue {
  firstName: string;
  lastName: string;
  phone: string;
  marketingEmailsOptIn: boolean;
}

export function ProfileForm({
  account,
  isSubmitting,
  onSubmit,
}: {
  account: MyAccount;
  isSubmitting: boolean;
  onSubmit: (value: ProfileFormValue) => void;
}) {
  const [firstName, setFirstName] = useState(account.firstName);
  const [lastName, setLastName] = useState(account.lastName);
  const [phone, setPhone] = useState(account.phone ?? '');
  const [marketingEmailsOptIn, setMarketingEmailsOptIn] = useState(
    account.preferences.marketingEmailsOptIn,
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ firstName, lastName, phone, marketingEmailsOptIn });
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Nombre" htmlFor="profile-firstName">
          <Input
            id="profile-firstName"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </FormField>
        <FormField label="Apellido" htmlFor="profile-lastName">
          <Input
            id="profile-lastName"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </FormField>
        <FormField label="Teléfono (opcional)" htmlFor="profile-phone">
          <Input
            id="profile-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={marketingEmailsOptIn}
          onChange={(event) => setMarketingEmailsOptIn(event.target.checked)}
        />
        Recibir correos promocionales
      </label>

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
