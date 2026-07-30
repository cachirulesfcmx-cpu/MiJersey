'use client';

import Link from 'next/link';

import { CartItemRow } from '../../components/cart/CartItemRow';
import { CouponBox } from '../../components/cart/CouponBox';
import { OrderSummary } from '../../components/cart/OrderSummary';
import { ShippingEstimator } from '../../components/cart/ShippingEstimator';
import { Breadcrumbs } from '../../components/plp/Breadcrumbs';
import { useCart } from '../../providers/cart-provider';

export default function CartPage() {
  const { cart, isLoading, error, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Carrito' }]} />
      <h1 className="text-3xl font-semibold text-neutral-900">Tu carrito</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {isLoading || !cart ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : cart.items.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-neutral-600">Tu carrito está vacío.</p>
          <Link href="/search" className="text-brand-600 text-sm hover:underline">
            Ir a comprar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col md:col-span-2">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <OrderSummary cart={cart} />
            <CouponBox coupon={cart.coupon} onApply={applyCoupon} onRemove={removeCoupon} />
            <ShippingEstimator />
            {/* Checkout llega con 018-Checkout: botón deshabilitado como stub visual. */}
            <button
              type="button"
              disabled
              title="Disponible cuando se implemente el checkout (018)"
              className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600"
            >
              Ir a pagar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
