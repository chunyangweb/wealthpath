import { PRODUCTS, getDefaultRate } from '@/data/products.fr';
import type {
  CustomProductConfig,
  ProductTimeline,
  StandardProductId,
} from '@/state/allocationStore';
import type { ProductId } from '@/types/product';
import type { LiquidityProductInput } from './liquidity';
import type { ProductProjectionInput } from './projection';

export type AllocatedStandardProduct = [StandardProductId, number];

type ProductInputArgs = {
  allocatedStandard: AllocatedStandardProduct[];
  custom: CustomProductConfig;
  hasCustom: boolean;
  rateOverrides: Partial<Record<ProductId, number>>;
  timelines: Record<string, ProductTimeline>;
  today: string;
};

export function getAllocatedStandardProducts(
  amounts: Partial<Record<StandardProductId, number>>,
): AllocatedStandardProduct[] {
  return (Object.entries(amounts) as AllocatedStandardProduct[]).filter(
    ([, amount]) => amount > 0,
  );
}

export function buildProjectionProducts({
  allocatedStandard,
  custom,
  hasCustom,
  rateOverrides,
  timelines,
  today,
}: ProductInputArgs): ProductProjectionInput[] {
  const products: ProductProjectionInput[] = allocatedStandard.map(
    ([id, amount]) => {
      const product = PRODUCTS[id];
      const timeline = timelines[id];
      return {
        id,
        amount,
        annualRate: rateOverrides[id] ?? getDefaultRate(product),
        startDate: timeline?.startDate ?? today,
        endDate: timeline?.endDate,
      };
    },
  );

  if (hasCustom) {
    const timeline = timelines.custom;
    products.push({
      id: 'custom',
      amount: custom.amount,
      annualRate: custom.annualRate,
      startDate: timeline?.startDate ?? today,
      endDate: timeline?.endDate,
    });
  }

  return products;
}

export function buildLiquidityProducts({
  allocatedStandard,
  custom,
  hasCustom,
  rateOverrides,
  timelines,
  today,
}: ProductInputArgs): LiquidityProductInput[] {
  const products: LiquidityProductInput[] = allocatedStandard.map(
    ([id, amount]) => {
      const product = PRODUCTS[id];
      const timeline = timelines[id];
      return {
        id,
        amount,
        annualRate: rateOverrides[id] ?? getDefaultRate(product),
        startDate: timeline?.startDate ?? today,
        endDate: timeline?.endDate,
        pool: product.pool,
        lockIn: product.lockIn,
      };
    },
  );

  if (hasCustom) {
    const timeline = timelines.custom;
    products.push({
      id: 'custom',
      amount: custom.amount,
      annualRate: custom.annualRate,
      startDate: timeline?.startDate ?? today,
      endDate: timeline?.endDate,
      pool: custom.pool,
      lockIn: { kind: 'none' },
    });
  }

  return products;
}

export function sumProductAmounts(products: { amount: number }[]): number {
  return products.reduce((total, product) => total + product.amount, 0);
}
