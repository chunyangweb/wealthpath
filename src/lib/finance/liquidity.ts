/**
 * Liquidity engine (M4).
 *
 * For each month in the horizon, classifies the total portfolio value into
 * three buckets:
 *   - liquid     : accessible immediately (livrets, CEL, custom-liquid, realized)
 *   - semi-liquid: accessible with delay or tax friction (AV, CTO, PEA after 5y)
 *   - locked     : not accessible without closing/penalty (PEL, PER, PEA < 5y)
 *
 * Special rule — PEA:
 *   Locked for the first 60 months from startDate, then reclassified as
 *   semi-liquid (withdrawals trigger 18.6% social charges only, 0% IR).
 *
 * Before startDate: allocation amount is treated as liquid cash (not yet invested).
 * After endDate:    final compounded value is treated as liquid cash (realized).
 */

import type { LiquidityPool, LockIn } from '@/types/product';

export type LiquidityProductInput = {
  id: string;
  amount: number;
  annualRate: number;
  startDate: string;   // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD (optional)
  pool: LiquidityPool;
  lockIn: LockIn;
};

export type LiquidityInput = {
  startingBalance: number;
  monthlySavings: number;
  totalAllocated: number;
  products: LiquidityProductInput[];
  horizonMonths: number;
  today: string;       // YYYY-MM-DD
};

export type LiquidityPoint = {
  monthIndex: number;
  label: string;
  tooltipLabel: string;
  liquid: number;
  semiLiquid: number;
  locked: number;
};

export type LiquidityResult = {
  points: LiquidityPoint[];
  finalLiquid: number;
  finalSemiLiquid: number;
  finalLocked: number;
};

// ---------- Helpers (mirrors projection.ts) ----------

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function addMonthsToDate(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatLabel(date: Date, monthIndex: number, horizonMonths: number): string {
  if (monthIndex === 0) return 'Now';
  const step =
    horizonMonths <= 12 ? 2 :
    horizonMonths <= 24 ? 4 :
    horizonMonths <= 36 ? 6 : 12;
  if (monthIndex % step !== 0) return '';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTooltipLabel(date: Date, monthIndex: number): string {
  if (monthIndex === 0) return 'Now';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Resolve the effective liquidity pool for an active product.
 * Only PEA changes pool over time (locked → semi-liquid after 60 months).
 */
function resolvePool(pool: LiquidityPool, lockIn: LockIn, monthsActive: number): LiquidityPool {
  if (pool !== 'locked') return pool;
  if (lockIn.kind === 'until-event' && lockIn.event === '5-years') {
    return monthsActive >= 60 ? 'semi-liquid' : 'locked';
  }
  return 'locked';
}

// ---------- Main entry point ----------

export function computeLiquidity(input: LiquidityInput): LiquidityResult {
  const { startingBalance, monthlySavings, totalAllocated, products, horizonMonths, today } = input;
  const todayDate = parseYMD(today);
  const permanentCash = startingBalance - totalAllocated;

  const points: LiquidityPoint[] = [];

  for (let m = 0; m <= horizonMonths; m++) {
    const currentDate = addMonthsToDate(todayDate, m);
    let liquid = permanentCash + monthlySavings * m;
    let semiLiquid = 0;
    let locked = 0;

    for (const p of products) {
      const startDate = parseYMD(p.startDate);

      if (currentDate < startDate) {
        // Not yet started — allocation sits in the cash pool
        liquid += p.amount;
        continue;
      }

      if (p.endDate) {
        const endDate = parseYMD(p.endDate);
        if (currentDate >= endDate) {
          // Realized — final compounded value returned to liquid cash
          const months = monthsBetween(startDate, endDate);
          liquid += p.amount * Math.pow(1 + p.annualRate, months / 12);
          continue;
        }
      }

      // Active: compound and classify
      const monthsActive = monthsBetween(startDate, currentDate);
      const value = p.amount * Math.pow(1 + p.annualRate, monthsActive / 12);
      const effectivePool = resolvePool(p.pool, p.lockIn, monthsActive);

      if (effectivePool === 'liquid') liquid += value;
      else if (effectivePool === 'semi-liquid') semiLiquid += value;
      else locked += value;
    }

    points.push({
      monthIndex: m,
      label: formatLabel(currentDate, m, horizonMonths),
      tooltipLabel: formatTooltipLabel(currentDate, m),
      liquid,
      semiLiquid,
      locked,
    });
  }

  const last = points[points.length - 1];
  return {
    points,
    finalLiquid: last.liquid,
    finalSemiLiquid: last.semiLiquid,
    finalLocked: last.locked,
  };
}
