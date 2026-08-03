import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="text-sm text-neutral-500">
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={index}>
          {item.href ? (
            <Link href={item.href} className="link-underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-900">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="mx-2">/</span>}
        </span>
      ))}
    </nav>
  );
}
