import { describe, it, expect } from 'vitest';
import { toMonthlyAmount, sumMonthly } from '@/lib/utils/frequencyToMonthly';
import type { CashFlow } from '@/lib/storage/schema';

function mkRow(overrides: Partial<CashFlow>): CashFlow {
  return {
    id: 'test',
    label: 'Test',
    amount: 100,
    frequency: 'monthly',
    startDate: '2026-01-01',
    ...overrides,
  };
}

describe('toMonthlyAmount', () => {
  it('returns the amount unchanged for monthly cashflows', () => {
    expect(toMonthlyAmount(mkRow({ amount: 1000, frequency: 'monthly' }))).toBe(
      1000,
    );
  });

  it('divides yearly amounts by 12', () => {
    expect(toMonthlyAmount(mkRow({ amount: 12000, frequency: 'yearly' }))).toBe(
      1000,
    );
  });

  it('multiplies weekly amounts by 52/12', () => {
    const result = toMonthlyAmount(mkRow({ amount: 100, frequency: 'weekly' }));
    expect(result).toBeCloseTo(433.33, 1);
  });

  it('multiplies daily amounts by 30', () => {
    expect(toMonthlyAmount(mkRow({ amount: 10, frequency: 'daily' }))).toBe(
      300,
    );
  });

  it('returns 0 for one-off cashflows', () => {
    expect(toMonthlyAmount(mkRow({ amount: 5000, frequency: 'one-off' }))).toBe(
      0,
    );
  });
});

describe('sumMonthly', () => {
  it('sums monthly equivalents across rows', () => {
    const rows: CashFlow[] = [
      mkRow({ amount: 1000, frequency: 'monthly' }),
      mkRow({ amount: 12000, frequency: 'yearly' }),
      mkRow({ amount: 100, frequency: 'one-off' }),
    ];
    // 1000 + 1000 + 0 = 2000
    expect(sumMonthly(rows)).toBe(2000);
  });

  it('returns 0 for an empty array', () => {
    expect(sumMonthly([])).toBe(0);
  });
});
