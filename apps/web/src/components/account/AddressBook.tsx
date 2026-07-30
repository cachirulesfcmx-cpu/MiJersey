'use client';

import type { Address, AddressType, CreateAddressInput } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useState } from 'react';

const EMPTY_FORM: CreateAddressInput = {
  type: 'SHIPPING',
  firstName: '',
  lastName: '',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'MX',
};

function formatAddress(address: Address): string {
  return `${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
}

export function AddressBook({
  addresses,
  isSubmitting,
  onCreate,
  onSetDefault,
  onDelete,
}: {
  addresses: Address[];
  isSubmitting: boolean;
  onCreate: (input: CreateAddressInput) => Promise<void>;
  onSetDefault: (address: Address) => Promise<void>;
  onDelete: (address: Address) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<CreateAddressInput>(EMPTY_FORM);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onCreate(form);
    setForm(EMPTY_FORM);
    setIsAdding(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {addresses.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no tienes direcciones guardadas.</p>
        )}
        {addresses.map((address) => (
          <div
            key={address.id}
            className="flex flex-col gap-1 rounded-md border border-neutral-200 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900">
                {address.firstName} {address.lastName} —{' '}
                {address.type === 'SHIPPING' ? 'Envío' : 'Facturación'}
                {address.isDefault && (
                  <span className="text-brand-600 ml-2 text-xs">(predeterminada)</span>
                )}
              </span>
            </div>
            <p className="text-neutral-600">{formatAddress(address)}</p>
            <div className="mt-1 flex gap-3">
              {!address.isDefault && (
                <button
                  type="button"
                  className="text-sm text-neutral-600 hover:underline"
                  onClick={() => void onSetDefault(address)}
                >
                  Hacer predeterminada
                </button>
              )}
              <button
                type="button"
                className="text-danger-600 text-sm hover:underline"
                onClick={() => void onDelete(address)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding ? (
        <form
          className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <FormField label="Tipo" htmlFor="address-type">
            <select
              id="address-type"
              className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as AddressType })}
            >
              <option value="SHIPPING">Envío</option>
              <option value="BILLING">Facturación</option>
            </select>
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Nombre" htmlFor="address-firstName">
              <Input
                id="address-firstName"
                required
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              />
            </FormField>
            <FormField label="Apellido" htmlFor="address-lastName">
              <Input
                id="address-lastName"
                required
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              />
            </FormField>
            <FormField label="Dirección" htmlFor="address-line1">
              <Input
                id="address-line1"
                required
                value={form.addressLine1}
                onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
              />
            </FormField>
            <FormField label="Ciudad" htmlFor="address-city">
              <Input
                id="address-city"
                required
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </FormField>
            <FormField label="Estado" htmlFor="address-state">
              <Input
                id="address-state"
                required
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              />
            </FormField>
            <FormField label="Código postal" htmlFor="address-postalCode">
              <Input
                id="address-postalCode"
                required
                value={form.postalCode}
                onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
              />
            </FormField>
            <FormField label="País (2 letras)" htmlFor="address-country">
              <Input
                id="address-country"
                required
                maxLength={2}
                value={form.country}
                onChange={(event) =>
                  setForm({ ...form, country: event.target.value.toUpperCase() })
                }
              />
            </FormField>
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              Guardar dirección
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="self-start" onClick={() => setIsAdding(true)}>
          Agregar dirección
        </Button>
      )}
    </div>
  );
}
