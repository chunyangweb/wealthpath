import type { CashFlow } from '@/lib/storage/schema';

/**
 * Convert a cashflow to its monthly equivalent (in EUR).
 *
 * Used by the inputs page summary widget to show "you save X € per month."
 * Approximate by design — uses 30 days/month and 52 weeks/year.
 * Precise monthly projection is the projection engine's job (M3).
 *
 * One-off cashflows return 0 — they don't have a meaningful monthly equivalent.
 */
export function toMonthlyAmount(cf: CashFlow): number {
  switch (cf.frequency) {
    case 'daily':
      return cf.amount * 30;
    case 'weekly':
      return cf.amount * (52 / 12);
    case 'monthly':
      return cf.amount;
    case 'yearly':
      return cf.amount / 12;
    case 'one-off':
      return 0;
  }
}

export function sumMonthly(rows: CashFlow[]): number {
  return rows.reduce((acc, r) => acc + toMonthlyAmount(r), 0);
}
