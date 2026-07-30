'use client';

import type { Checkout, CheckoutAddressInput, Order, ShippingMethod } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { AddressForm, type AddressFormValue } from '../../components/checkout/AddressForm';
import { CheckoutProgress, type CheckoutStep } from '../../components/checkout/CheckoutProgress';
import { CheckoutSummary } from '../../components/checkout/CheckoutSummary';
import { ErrorRecovery } from '../../components/checkout/ErrorRecovery';
import { ShippingSelector } from '../../components/checkout/ShippingSelector';
import { Breadcrumbs } from '../../components/plp/Breadcrumbs';
import { env } from '../../config/env';
import { useAuth } from '../../providers/auth-provider';
import { useCart } from '../../providers/cart-provider';

/** Los campos opcionales de dirección llegan como `''` desde el formulario (controlado) — el DTO del backend valida longitud mínima 1 cuando el campo está presente, así que hay que omitirlos en vez de mandar cadenas vacías. */
function sanitizeAddress(address: CheckoutAddressInput): CheckoutAddressInput {
  const sanitized: CheckoutAddressInput = {
    firstName: address.firstName,
    lastName: address.lastName,
    addressLine1: address.addressLine1,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
  if (address.company) sanitized.company = address.company;
  if (address.addressLine2) sanitized.addressLine2 = address.addressLine2;
  if (address.phone) sanitized.phone = address.phone;
  return sanitized;
}

function resolveStep(checkout: Checkout): CheckoutStep {
  if (!checkout.shippingAddress || !checkout.contactEmail) return 'address';
  if (!checkout.shippingMethod) return 'shipping';
  return 'review';
}

export default function CheckoutPage() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { accessToken } = useAuth();
  const { sessionId } = useCart();

  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [step, setStep] = useState<CheckoutStep>('address');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      client.getCheckout(sessionId, accessToken ?? undefined),
      client.getCheckoutShippingMethods(),
    ])
      .then(([checkoutResult, methodsResult]) => {
        setCheckout(checkoutResult);
        setShippingMethods(methodsResult.items);
        setStep(resolveStep(checkoutResult));
      })
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el checkout.');
      })
      .finally(() => setIsLoading(false));
  }, [client, sessionId, accessToken]);

  async function handleAddressSubmit(value: AddressFormValue) {
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await client.setCheckoutAddress(
        sessionId,
        {
          contactEmail: value.contactEmail,
          shipping: sanitizeAddress(value.shipping),
          ...(value.billingSameAsShipping ? {} : { billing: sanitizeAddress(value.billing) }),
        },
        accessToken ?? undefined,
      );
      setCheckout(updated);
      setStep('shipping');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar la dirección.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleShippingSubmit(shippingMethodId: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await client.setCheckoutShippingMethod(sessionId, shippingMethodId, accessToken ?? undefined);
      const reviewed = await client.reviewCheckout(sessionId, accessToken ?? undefined);
      setCheckout(reviewed);
      setStep('review');
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo seleccionar el método de envío.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRetryReview() {
    setError(null);
    setIsSubmitting(true);
    try {
      const reviewed = await client.reviewCheckout(sessionId, accessToken ?? undefined);
      setCheckout(reviewed);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo revisar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      const { order: createdOrder } = await client.confirmCheckout(
        sessionId,
        accessToken ?? undefined,
      );
      setOrder(createdOrder);
      setStep('confirmed');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo confirmar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Checkout' }]} />
      <h1 className="text-3xl font-semibold text-neutral-900">Checkout</h1>

      {step !== 'confirmed' && <CheckoutProgress current={step} />}

      {isLoading || !checkout ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : checkout.cart.items.length === 0 && step !== 'confirmed' ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-neutral-600">Tu carrito está vacío.</p>
          <Link href="/search" className="text-brand-600 text-sm hover:underline">
            Ir a comprar
          </Link>
        </div>
      ) : (
        <>
          {error && step !== 'review' && <p className="text-danger-600 text-sm">{error}</p>}

          {step === 'address' && (
            <AddressForm
              initial={{ contactEmail: checkout.contactEmail ?? '' }}
              isSubmitting={isSubmitting}
              onSubmit={(value) => void handleAddressSubmit(value)}
            />
          )}

          {step === 'shipping' && (
            <ShippingSelector
              methods={shippingMethods}
              initialSelectedId={checkout.shippingMethod?.id}
              isSubmitting={isSubmitting}
              onSubmit={(shippingMethodId) => void handleShippingSubmit(shippingMethodId)}
            />
          )}

          {step === 'review' &&
            (error ? (
              <ErrorRecovery message={error} onRetry={() => void handleRetryReview()} />
            ) : (
              <CheckoutSummary
                checkout={checkout}
                isConfirming={isSubmitting}
                onConfirm={() => void handleConfirm()}
              />
            ))}

          {step === 'confirmed' && order && (
            <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900">¡Pedido registrado!</h2>
              <p className="text-sm text-neutral-600">
                Tu número de pedido es <strong>{order.orderNumber}</strong>. El pago se procesará en
                un paso posterior (022-Payments).
              </p>
              <p className="text-sm text-neutral-600">
                Total:{' '}
                {order.grandTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
              </p>
              <Link href="/" className="text-brand-600 text-sm hover:underline">
                Volver al inicio
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}
