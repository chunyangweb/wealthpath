/**
 * Projection engine (M3).
 *
 * Compounding model — verified against official French rules (service-public.fr):
 *   - All regulated livrets, CEL, PEL, AV fonds-euros: annual compounding,
 *     interest credited on Dec 31. For monthly data points we use the
 *     mathematically equivalent continuous form: amount × (1+r)^(months/12).
 *     Over exactly 12 months this gives precisely one year of compounding.
 *   - Market products (AV UC, PEA, PER, CTO): same formula with the
 *     effective rate from the slider (median scenario by default).
 *   - Rates are treated as net-of-tax throughout (rates already reflect
 *     the tax regime; gross-exit tax is modelled in M5).
 *
 * Timeline semantics:
 *   - Before startDate: the allocated amount sits as cash (no growth).
 *   - During [startDate, endDate]: amount compounds with the product rate.
 *   - After endDate: the final compounded value is treated as realized cash
 *     (included in total but no further growth on that product).
 *   - Products with no endDate compound for the full horizon.
 */

export type ProductProjectionInput = {
  id: string;
  amount: number;        // euros allocated (entered at startDate)
  annualRate: number;    // effective decimal rate (0.015 = 1.5%)
  startDate: string;     // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD (optional)
};

export type ProjectionInput = {
  startingBalance: number;       // total cash available today
  monthlySavings: number;        // net monthly free cash (income − expenses)
  totalAllocated: number;        // sum of all product amounts
  products: ProductProjectionInput[];
  horizonMonths: number;         // total months to project
  today: string;                 // YYYY-MM-DD reference date
};

export type ProjectionPoint = {
  monthIndex: number;            // 0 = today
  label: string;                 // display label for x-axis (sparse)
  tooltipLabel: string;          // always-set label for tooltip header
  noInvestment: number;          // pure cash scenario
  withInvestment: number;        // portfolio total
};

export type ProjectionResult = {
  points: ProjectionPoint[];
  finalNoInvestment: number;
  finalWithInvestment: number;
  totalInterestEarned: number;
};

// ---------- Helpers ----------

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Integer month count between two dates (ignores day-of-month). */
function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function addMonthsToDate(date: Date, months: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return d;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatLabel(date: Date, monthIndex: number, horizonMonths: number): string {
  if (monthIndex === 0) return 'Now';

  // Pick a step that keeps the label count manageable (~6-8 ticks)
  const step =
    horizonMonths <= 12 ? 2 :   // every 2 months  → ≤7 ticks
    horizonMonths <= 24 ? 4 :   // every 4 months  → ≤7 ticks
    horizonMonths <= 36 ? 6 :   // every 6 months  → ≤7 ticks
    12;                          // every year      → ≤11 ticks

  if (monthIndex % step !== 0) return '';

  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTooltipLabel(date: Date, monthIndex: number): string {
  if (monthIndex === 0) return 'Now';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

// ---------- Core calculation ----------

/**
 * Compute the value of a single product at a given calendar month.
 * Returns [productValue, cashReturnedToPool].
 *   productValue: amount still actively compounding in the product
 *   cashReturnedToPool: realized amount now sitting as cash (before start or after end)
 */
function productValueAt(
  p: ProductProjectionInput,
  currentDate: Date,
  today: Date,
): { activeValue: number; cashValue: number } {
  const startDate = parseYMD(p.startDate);

  if (currentDate < startDate) {
    // Investment hasn't started — money is in the cash pool
    return { activeValue: 0, cashValue: p.amount };
  }

  if (p.endDate) {
    const endDate = parseYMD(p.endDate);
    if (currentDate >= endDate) {
      // Investment period has ended — value is frozen as realized cash
      const months = monthsBetween(startDate, endDate);
      const finalValue = p.amount * Math.pow(1 + p.annualRate, months / 12);
      return { activeValue: 0, cashValue: finalValue };
    }
  }

  // Active compounding period
  const months = monthsBetween(startDate, currentDate);
  const value = p.amount * Math.pow(1 + p.annualRate, months / 12);
  return { activeValue: value, cashValue: 0 };
}

// ---------- Main entry point ----------

export function computeProjection(input: ProjectionInput): ProjectionResult {
  const {
    startingBalance,
    monthlySavings,
    totalAllocated,
    products,
    horizonMonths,
    today,
  } = input;

  const todayDate = parseYMD(today);
  // Cash that is never put into any product — stays flat + monthly savings
  const permanentCash = startingBalance - totalAllocated;

  const points: ProjectionPoint[] = [];

  for (let m = 0; m <= horizonMonths; m++) {
    const currentDate = addMonthsToDate(todayDate, m);

    // Baseline: no investment at all — cash + savings, no interest
    const noInvestment = startingBalance + monthlySavings * m;

    // Investment scenario
    let productTotal = 0;
    let returnedToCash = 0;

    for (const p of products) {
      const { activeValue, cashValue } = productValueAt(p, currentDate, todayDate);
      productTotal += activeValue;
      returnedToCash += cashValue;
    }

    // Total: permanent cash + returned cash + actively compounding products + monthly savings
    const withInvestment = permanentCash + returnedToCash + productTotal + monthlySavings * m;

    points.push({
      monthIndex: m,
      label: formatLabel(currentDate, m, horizonMonths),
      tooltipLabel: formatTooltipLabel(currentDate, m),
      noInvestment,
      withInvestment,
    });
  }

  const last = points[points.length - 1];
  return {
    points,
    finalNoInvestment: last.noInvestment,
    finalWithInvestment: last.withInvestment,
    totalInterestEarned: last.withInvestment - last.noInvestment,
  };
}
