import Link from 'next/link';

export function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-neutral-300 py-16 text-center">
      <p className="text-neutral-600">Tu lista de deseos está vacía.</p>
      <Link href="/search" className="btn-pop">
        Explorar productos
      </Link>
    </div>
  );
}
