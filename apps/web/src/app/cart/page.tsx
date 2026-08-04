'use client';

import Link from 'next/link';

import { CartItemRow } from '../../components/cart/CartItemRow';
import { CartRecommendations } from '../../components/cart/CartRecommendations';
import { CouponBox } from '../../components/cart/CouponBox';
import { DiscountSummary } from '../../components/cart/DiscountSummary';
import { OrderSummary } from '../../components/cart/OrderSummary';
import { PromotionBanner } from '../../components/cart/PromotionBanner';
import { VolumeDiscountProgress } from '../../components/home/VolumeDiscountProgress';
import { Breadcrumbs } from '../../components/plp/Breadcrumbs';
import { Reveal } from '../../components/ui/Reveal';
import { useCart } from '../../providers/cart-provider';

export default function CartPage() {
  const { cart, sessionId, isLoading, error, updateItem, removeItem, applyCoupon, removeCoupon } =
    useCart();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Carrito' }]} />
      <h1 className="section-heading">Tu carrito</h1>

      <PromotionBanner />

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {isLoading || !cart ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="skeleton-arena h-24 w-full" />
          ))}
        </div>
      ) : cart.items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-10">
          <p className="text-neutral-600">Tu carrito está vacío.</p>
          <Link href="/search" className="btn-pop">
            Ir a comprar
          </Link>
          <div className="mt-4 w-full">
            <CartRecommendations excludeProductIds={[]} />
          </div>
        </div>
      ) : (
        <>
          <Reveal className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-3 md:col-span-2">
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
              <VolumeDiscountProgress variant="inline" />
              <OrderSummary cart={cart} />
              <CouponBox coupon={cart.coupon} onApply={applyCoupon} onRemove={removeCoupon} />
              {sessionId && <DiscountSummary sessionId={sessionId} />}
              <Link href="/checkout" className="btn-pop">
                Ir a pagar
              </Link>
            </div>
          </Reveal>

          <CartRecommendations excludeProductIds={cart.items.map((item) => item.productId)} />
        </>
      )}
    </main>
  );
}
