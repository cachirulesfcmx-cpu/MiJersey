'use client';

import type { CheckoutAddressInput } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useState } from 'react';

export interface AddressFormValue {
  contactEmail: string;
  shipping: CheckoutAddressInput;
  billingSameAsShipping: boolean;
  billing: CheckoutAddressInput;
}

const EMPTY_ADDRESS: CheckoutAddressInput = {
  firstName: '',
  lastName: '',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'MX',
  phone: '',
};

function AddressFields({
  value,
  onChange,
  idPrefix,
}: {
  value: CheckoutAddressInput;
  onChange: (next: CheckoutAddressInput) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormField label="Nombre" htmlFor={`${idPrefix}-firstName`}>
        <Input
          id={`${idPrefix}-firstName`}
          required
          value={value.firstName}
          onChange={(event) => onChange({ ...value, firstName: event.target.value })}
        />
      </FormField>
      <FormField label="Apellido" htmlFor={`${idPrefix}-lastName`}>
        <Input
          id={`${idPrefix}-lastName`}
          required
          value={value.lastName}
          onChange={(event) => onChange({ ...value, lastName: event.target.value })}
        />
      </FormField>
      <FormField label="Dirección" htmlFor={`${idPrefix}-addressLine1`}>
        <Input
          id={`${idPrefix}-addressLine1`}
          required
          value={value.addressLine1}
          onChange={(event) => onChange({ ...value, addressLine1: event.target.value })}
        />
      </FormField>
      <FormField label="Interior / referencia (opcional)" htmlFor={`${idPrefix}-addressLine2`}>
        <Input
          id={`${idPrefix}-addressLine2`}
          value={value.addressLine2 ?? ''}
          onChange={(event) => onChange({ ...value, addressLine2: event.target.value })}
        />
      </FormField>
      <FormField label="Ciudad" htmlFor={`${idPrefix}-city`}>
        <Input
          id={`${idPrefix}-city`}
          required
          value={value.city}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
        />
      </FormField>
      <FormField label="Estado" htmlFor={`${idPrefix}-state`}>
        <Input
          id={`${idPrefix}-state`}
          required
          value={value.state}
          onChange={(event) => onChange({ ...value, state: event.target.value })}
        />
      </FormField>
      <FormField label="Código postal" htmlFor={`${idPrefix}-postalCode`}>
        <Input
          id={`${idPrefix}-postalCode`}
          required
          value={value.postalCode}
          onChange={(event) => onChange({ ...value, postalCode: event.target.value })}
        />
      </FormField>
      <FormField label="País (código de 2 letras)" htmlFor={`${idPrefix}-country`}>
        <Input
          id={`${idPrefix}-country`}
          required
          maxLength={2}
          value={value.country}
          onChange={(event) => onChange({ ...value, country: event.target.value.toUpperCase() })}
        />
      </FormField>
      <FormField label="Teléfono (opcional)" htmlFor={`${idPrefix}-phone`}>
        <Input
          id={`${idPrefix}-phone`}
          value={value.phone ?? ''}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
        />
      </FormField>
    </div>
  );
}

export function AddressForm({
  initial,
  isSubmitting,
  onSubmit,
}: {
  initial?: Partial<AddressFormValue>;
  isSubmitting: boolean;
  onSubmit: (value: AddressFormValue) => void;
}) {
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? '');
  const [shipping, setShipping] = useState<CheckoutAddressInput>({
    ...EMPTY_ADDRESS,
    ...initial?.shipping,
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(
    initial?.billingSameAsShipping ?? true,
  );
  const [billing, setBilling] = useState<CheckoutAddressInput>({
    ...EMPTY_ADDRESS,
    ...initial?.billing,
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ contactEmail, shipping, billingSameAsShipping, billing });
      }}
    >
      <FormField label="Correo de contacto" htmlFor="contactEmail">
        <Input
          id="contactEmail"
          type="email"
          required
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
        />
      </FormField>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Dirección de envío</h2>
        <AddressFields value={shipping} onChange={setShipping} idPrefix="shipping" />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={billingSameAsShipping}
          onChange={(event) => setBillingSameAsShipping(event.target.checked)}
        />
        Usar la misma dirección para facturación
      </label>

      {!billingSameAsShipping && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-neutral-900">Dirección de facturación</h2>
          <AddressFields value={billing} onChange={setBilling} idPrefix="billing" />
        </div>
      )}

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Continuar a envío
      </Button>
    </form>
  );
}
