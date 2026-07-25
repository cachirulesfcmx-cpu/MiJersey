import type { HTMLAttributes } from 'react';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  const classes = ['animate-pulse rounded-md bg-neutral-100', className].filter(Boolean).join(' ');

  return <div className={classes} {...props} />;
}
