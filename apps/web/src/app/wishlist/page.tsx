'use client';

import { Skeleton } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Breadcrumbs } from '../../components/plp/Breadcrumbs';
import { EmptyWishlist } from '../../components/wishlist/EmptyWishlist';
import { ShareWishlistPanel } from '../../components/wishlist/ShareWishlistPanel';
import { WishlistItemCard } from '../../components/wishlist/WishlistItemCard';
import { useAuth } from '../../providers/auth-provider';
import { useWishlist } from '../../providers/wishlist-provider';

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { wishlist, isLoading, error, removeItem, moveItemToCart, shareWishlist } = useWishlist();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Mi lista de deseos' }]} />
      <h1 className="text-3xl font-semibold text-neutral-900">Mi lista de deseos</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {isLoading || !wishlist ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : wishlist.items.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <div className="flex flex-col gap-6">
          <ShareWishlistPanel shareToken={wishlist.shareToken} onShare={shareWishlist} />
          <div className="flex flex-col">
            {wishlist.items.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                onRemove={removeItem}
                onMoveToCart={moveItemToCart}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
