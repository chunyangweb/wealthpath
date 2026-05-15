import type { LiquidityPool } from '@/types/product';
import { cn } from '@/lib/utils';

/**
 * Tiny color indicator next to a product name showing its liquidity category.
 * Green = liquid, amber = semi-liquid, gray = locked.
 */
export function PoolDot({
  pool,
  className,
}: {
  pool: LiquidityPool;
  className?: string;
}) {
  const colorClass =
    pool === 'liquid'
      ? 'bg-pool-liquid'
      : pool === 'semi-liquid'
        ? 'bg-pool-semi'
        : 'bg-pool-locked';
  return (
    <span
      aria-hidden
      className={cn('inline-block h-2 w-2 rounded-full', colorClass, className)}
    />
  );
}
