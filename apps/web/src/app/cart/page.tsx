'use client';

import Link from 'next/link';

import { CartItemRow } from '../../components/cart/CartItemRow';
import { CouponBox } from '../../components/cart/CouponBox';
import { DiscountSummary } from '../../components/cart/DiscountSummary';
import { OrderSummary } from '../../components/cart/OrderSummary';
import { PromotionBanner } from '../../components/cart/PromotionBanner';
import { Breadcrumbs } from '../../components/plp/Breadcrumbs';
import { useCart } from '../../providers/cart-provider';

export default function CartPage() {
  const { cart, sessionId, isLoading, error, updateItem, removeItem, applyCoupon, removeCoupon } =
    useCart();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Carrito' }]} />
      <h1 className="text-3xl font-semibold text-neutral-900">Tu carrito</h1>

      <PromotionBanner />

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
            {sessionId && <DiscountSummary sessionId={sessionId} />}
            <Link
              href="/checkout"
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-center text-sm font-medium text-white"
            >
              Ir a pagar
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
