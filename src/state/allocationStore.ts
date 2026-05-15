import { create } from 'zustand';
import { z } from 'zod';
import type { ProductId, LiquidityPool } from '@/types/product';
import { readValidated, write } from '@/lib/storage/localStorage';

// Re-export so allocation components can import from one place
export type { LiquidityPool };

// ---------- Per-product timeline ----------
const ProductTimelineSchema = z.object({
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string().optional(),
});
export type ProductTimeline = z.infer<typeof ProductTimelineSchema>;

const TimelinesSchema = z
  .record(z.string(), ProductTimelineSchema)
  .default({});

/**
 * Allocation store.
 *
 * Holds:
 *   - amount allocated to each of the 11 regulated products
 *   - optional rate override per product (user can change the default rate to
 *     match their actual bank or test a scenario)
 *   - the custom product config (name, rate, pool, amount)
 *   - which profile is currently active (for the snap-back UX)
 *
 * Persistence: full state is written to localStorage debounced 500ms after change.
 */

// ---------- Custom product config ----------
const CustomProductSchema = z.object({
  name: z.string().max(80),
  amount: z.number().nonnegative().finite(),
  /** Annual return as a decimal, e.g. 0.05 for 5%. Treated as net of tax. */
  annualRate: z.number().min(-1).max(2),
  pool: z.enum(['liquid', 'locked']),
});
export type CustomProductConfig = z.infer<typeof CustomProductSchema>;

const ALL_PRODUCT_IDS = [
  'livret-a',
  'ldds',
  'lep',
  'livret-jeune',
  'cel',
  'pel',
  'av-fonds-euros',
  'av-uc',
  'pea',
  'per',
  'cto',
] as const;

// 'custom' is intentionally excluded from amounts — its amount lives in the custom config.
const ALL_PRODUCT_IDS_WITH_CUSTOM = [...ALL_PRODUCT_IDS, 'custom'] as const;

export type StandardProductId = (typeof ALL_PRODUCT_IDS)[number];
export { ALL_PRODUCT_IDS };

const AmountsSchema = z.record(
  z.enum(ALL_PRODUCT_IDS),
  z.number().nonnegative().finite(),
);

const RateOverridesSchema = z.record(
  z.enum(ALL_PRODUCT_IDS_WITH_CUSTOM),
  z.number().min(-1).max(2),
);

const PersistedAllocationSchema = z.object({
  amounts: AmountsSchema.default({} as Record<StandardProductId, number>),
  rateOverrides: RateOverridesSchema.default(
    {} as Record<ProductId, number>,
  ),
  custom: CustomProductSchema.default({
    name: '',
    amount: 0,
    annualRate: 0.04,
    pool: 'liquid',
  }),
  activeProfile: z.enum(['prudent', 'balanced', 'dynamic']).default('balanced'),
  timelines: TimelinesSchema,
});

type PersistedAllocation = z.infer<typeof PersistedAllocationSchema>;

const STORAGE_KEY = 'allocation';

function emptyAmounts(): Record<StandardProductId, number> {
  return Object.fromEntries(ALL_PRODUCT_IDS.map((id) => [id, 0])) as Record<
    StandardProductId,
    number
  >;
}

function loadInitial(): PersistedAllocation {
  const stored = readValidated(STORAGE_KEY, PersistedAllocationSchema);
  if (stored) {
    return {
      ...stored,
      amounts: { ...emptyAmounts(), ...stored.amounts },
      rateOverrides: stored.rateOverrides,
    };
  }
  return {
    amounts: emptyAmounts(),
    rateOverrides: {} as Record<ProductId, number>,
    custom: {
      name: '',
      amount: 0,
      annualRate: 0.04,
      pool: 'liquid',
    },
    activeProfile: 'balanced',
    timelines: {},
  };
}

// ---------- Store interface ----------
type AllocationState = PersistedAllocation & {
  setAmount: (productId: StandardProductId, amount: number) => void;
  setRateOverride: (productId: ProductId, rate: number | null) => void;
  setCustom: (patch: Partial<CustomProductConfig>) => void;
  setActiveProfile: (profile: 'prudent' | 'balanced' | 'dynamic') => void;
  setTimeline: (productId: ProductId, timeline: ProductTimeline) => void;
  /**
   * Snap all sliders to the given amounts (used when user picks a profile).
   * The custom product is preserved as-is — only standard products snap.
   */
  snapTo: (amounts: Record<StandardProductId, number>) => void;
  reset: () => void;
};

// ---------- Persistence ----------
let writeTimer: number | undefined;
function persistDebounced(state: PersistedAllocation) {
  if (writeTimer !== undefined) {
    window.clearTimeout(writeTimer);
  }
  writeTimer = window.setTimeout(() => {
    write(STORAGE_KEY, state);
  }, 500);
}

function stripActions(s: AllocationState): PersistedAllocation {
  return {
    amounts: s.amounts,
    rateOverrides: s.rateOverrides,
    custom: s.custom,
    activeProfile: s.activeProfile,
    timelines: s.timelines,
  };
}

// ---------- Store ----------
export const useAllocationStore = create<AllocationState>((set, get) => ({
  ...loadInitial(),

  setAmount: (productId, amount) => {
    set((s) => ({
      amounts: { ...s.amounts, [productId]: Math.max(0, amount) },
    }));
    persistDebounced(stripActions(get()));
  },

  setRateOverride: (productId, rate) => {
    set((s) => {
      const next = { ...s.rateOverrides };
      if (rate === null) {
        delete next[productId];
      } else {
        next[productId] = rate;
      }
      return { rateOverrides: next };
    });
    persistDebounced(stripActions(get()));
  },

  setCustom: (patch) => {
    set((s) => ({ custom: { ...s.custom, ...patch } }));
    persistDebounced(stripActions(get()));
  },

  setActiveProfile: (activeProfile) => {
    set({ activeProfile });
    persistDebounced(stripActions(get()));
  },

  setTimeline: (productId, timeline) => {
    set((s) => ({ timelines: { ...s.timelines, [productId]: timeline } }));
    persistDebounced(stripActions(get()));
  },

  snapTo: (amounts) => {
    set({ amounts });
    persistDebounced(stripActions(get()));
  },

  reset: () => {
    const fresh = loadInitial();
    set(fresh);
    persistDebounced(fresh);
  },
}));

/**
 * Selector helper: get the effective rate for a product (override or default).
 * The component shouldn't import PRODUCTS directly; it goes through this.
 */
export function getEffectiveRate(
  productId: ProductId,
  state: AllocationState,
  defaultRate: number,
): number {
  return state.rateOverrides[productId] ?? defaultRate;
}

/**
 * Selector helper: total amount allocated across all products.
 */
export function totalAllocated(state: AllocationState): number {
  return (
    Object.values(state.amounts).reduce((acc, v) => acc + v, 0) +
    state.custom.amount
  );
}
