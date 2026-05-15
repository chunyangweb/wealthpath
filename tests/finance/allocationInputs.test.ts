import { describe, expect, it } from 'vitest';
import {
  buildLiquidityProducts,
  buildProjectionProducts,
  getAllocatedStandardProducts,
  sumProductAmounts,
} from '@/lib/finance/allocationInputs';
import type {
  CustomProductConfig,
  StandardProductId,
} from '@/state/allocationStore';

const custom: CustomProductConfig = {
  name: 'Custom',
  amount: 250,
  annualRate: 0.04,
  pool: 'locked',
};

describe('allocation input builders', () => {
  it('filters unallocated standard products', () => {
    const amounts: Partial<Record<StandardProductId, number>> = {
      'livret-a': 1000,
      ldds: 0,
      pea: 500,
    };

    expect(getAllocatedStandardProducts(amounts)).toEqual([
      ['livret-a', 1000],
      ['pea', 500],
    ]);
  });

  it('builds projection products with timeline fallbacks and custom allocation', () => {
    const products = buildProjectionProducts({
      allocatedStandard: [['livret-a', 1000]],
      custom,
      hasCustom: true,
      rateOverrides: { 'livret-a': 0.02 },
      timelines: {
        'livret-a': { startDate: '2026-06-01', endDate: '2027-06-01' },
      },
      today: '2026-05-15',
    });

    expect(products).toEqual([
      {
        id: 'livret-a',
        amount: 1000,
        annualRate: 0.02,
        startDate: '2026-06-01',
        endDate: '2027-06-01',
      },
      {
        id: 'custom',
        amount: 250,
        annualRate: 0.04,
        startDate: '2026-05-15',
        endDate: undefined,
      },
    ]);
    expect(sumProductAmounts(products)).toBe(1250);
  });

  it('adds liquidity metadata for standard and custom products', () => {
    const products = buildLiquidityProducts({
      allocatedStandard: [['pea', 1000]],
      custom,
      hasCustom: true,
      rateOverrides: {},
      timelines: {},
      today: '2026-05-15',
    });

    expect(products[0]).toMatchObject({
      id: 'pea',
      pool: 'locked',
      lockIn: { kind: 'until-event', event: '5-years' },
    });
    expect(products[1]).toMatchObject({
      id: 'custom',
      pool: 'locked',
      lockIn: { kind: 'none' },
    });
  });
});
