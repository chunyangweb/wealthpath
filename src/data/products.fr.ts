import type { Product, ProductId } from '@/types/product';

/**
 * The French savings & investment product catalog.
 *
 * SINGLE SOURCE OF TRUTH for rates, caps, lock-ins, and tax regimes.
 * When French law changes, every rate update happens in this file.
 *
 * Verification date for this version: 2026-05-15.
 *
 * Critical 2026 fiscal change:
 * The LFSS 2026 raised social charges (CSG) from 17.2% → 18.6% for most
 * financial income. Exceptions explicitly kept at 17.2%:
 *   - Assurance-vie (all)
 *   - PEL / CEL
 *   - PEP (not in our scope)
 * Products subject to the new 18.6%:
 *   - PEA (post-5-year tax-free withdrawals now bear 18.6% PS)
 *   - PER (gains portion at exit)
 *   - CTO (PFU now totals 12.8% + 18.6% = 31.4%)
 */

const SOURCES = {
  livrets: {
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2365',
    verifiedOn: '2026-05-15',
  },
  pel: {
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F16139',
    verifiedOn: '2026-05-15',
  },
  cel: {
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2367',
    verifiedOn: '2026-05-15',
  },
  av: {
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F15268',
    verifiedOn: '2026-05-15',
  },
  pea: {
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2385',
    verifiedOn: '2026-05-15',
  },
  per: {
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34982',
    verifiedOn: '2026-05-15',
  },
  cto: {
    url: 'https://www.impots.gouv.fr/particulier/les-revenus-de-capitaux-mobiliers',
    verifiedOn: '2026-05-15',
  },
} as const;

// Social charges rates after LFSS 2026
const PS_NEW = 0.186; // PEA, PER, CTO
const PS_KEPT = 0.172; // AV, PEL, CEL — preserved by the LFSS 2026 carve-out

export const PRODUCTS: Record<ProductId, Product> = {
  // ============ Liquid regulated savings ============
  'livret-a': {
    id: 'livret-a',
    category: 'liquid-regulated',
    pool: 'liquid',
    defaultReturn: { kind: 'fixed', rate: 0.015 }, // 1.5% net since Feb 2026
    cap: 22950,
    lockIn: { kind: 'none' },
    taxRegime: { kind: 'tax-free' },
    source: SOURCES.livrets,
  },
  ldds: {
    id: 'ldds',
    category: 'liquid-regulated',
    pool: 'liquid',
    defaultReturn: { kind: 'fixed', rate: 0.015 },
    cap: 12000,
    lockIn: { kind: 'none' },
    taxRegime: { kind: 'tax-free' },
    source: SOURCES.livrets,
  },
  lep: {
    id: 'lep',
    category: 'liquid-regulated',
    pool: 'liquid',
    defaultReturn: { kind: 'fixed', rate: 0.025 }, // 2.5% net since Feb 2026
    cap: 10000,
    lockIn: { kind: 'none' },
    taxRegime: { kind: 'tax-free' },
    source: SOURCES.livrets,
  },
  'livret-jeune': {
    id: 'livret-jeune',
    category: 'liquid-regulated',
    pool: 'liquid',
    defaultReturn: { kind: 'fixed', rate: 0.015 }, // bank-set, floor = Livret A
    cap: 1600,
    lockIn: { kind: 'none' },
    taxRegime: { kind: 'tax-free' },
    source: SOURCES.livrets,
  },
  cel: {
    id: 'cel',
    category: 'liquid-tax',
    pool: 'liquid',
    defaultReturn: { kind: 'fixed', rate: 0.01 }, // 1% net 2026
    cap: 15300,
    lockIn: { kind: 'none' },
    taxRegime: { kind: 'pfu', rate: 0.128, socialCharges: PS_KEPT },
    source: SOURCES.cel,
  },

  // ============ PEL — locked rate, closure-on-withdrawal ============
  pel: {
    id: 'pel',
    category: 'liquid-tax',
    pool: 'locked',
    defaultReturn: { kind: 'fixed', rate: 0.02 }, // 2% gross for new plans in 2026
    cap: 61200,
    lockIn: { kind: 'closure-on-withdrawal' },
    taxRegime: { kind: 'pfu', rate: 0.128, socialCharges: PS_KEPT },
    source: SOURCES.pel,
  },

  // ============ Assurance-vie ============
  'av-fonds-euros': {
    id: 'av-fonds-euros',
    category: 'market-stable',
    pool: 'semi-liquid',
    defaultReturn: { kind: 'fixed', rate: 0.0265 }, // 2025 market average
    cap: null,
    lockIn: { kind: 'none' },
    taxRegime: {
      kind: 'assurance-vie',
      preEightYearsPfu: 0.3, // 12.8 IR + 17.2 PS
      postEightYearsAllowance: { single: 4600, couple: 9200 },
      postEightYearsIr: 0.075,
      ps: PS_KEPT,
    },
    source: SOURCES.av,
  },
  'av-uc': {
    id: 'av-uc',
    category: 'market-equity',
    pool: 'semi-liquid',
    defaultReturn: {
      kind: 'scenario',
      pessimistic: 0.02,
      median: 0.06,
      optimistic: 0.09,
    },
    cap: null,
    lockIn: { kind: 'none' },
    taxRegime: {
      kind: 'assurance-vie',
      preEightYearsPfu: 0.3,
      postEightYearsAllowance: { single: 4600, couple: 9200 },
      postEightYearsIr: 0.075,
      ps: PS_KEPT,
    },
    source: SOURCES.av,
  },

  // ============ PEA ============
  pea: {
    id: 'pea',
    category: 'market-equity',
    pool: 'locked', // locked < 5 years; liquidity engine will reclassify after 5y
    defaultReturn: {
      kind: 'scenario',
      pessimistic: 0.03,
      median: 0.065,
      optimistic: 0.09,
    },
    cap: 150000,
    lockIn: { kind: 'until-event', event: '5-years' },
    taxRegime: {
      kind: 'pea',
      preFiveYearsPfu: 0.3,
      postFiveYearsPs: PS_NEW, // 18.6% post-LFSS-2026
    },
    source: SOURCES.pea,
  },

  // ============ PER ============
  per: {
    id: 'per',
    category: 'retirement',
    pool: 'locked',
    defaultReturn: {
      kind: 'scenario',
      pessimistic: 0.02,
      median: 0.05,
      optimistic: 0.08,
    },
    // Annual deductible cap depends on income; we use a reasonable ceiling here
    // and let the liquidity engine flag if a user puts more than they can deduct.
    cap: 37680,
    lockIn: { kind: 'until-event', event: 'retirement' },
    taxRegime: {
      kind: 'per-deductible-entry',
      gainsPfu: 0.128,
      ps: PS_NEW,
    },
    source: SOURCES.per,
  },

  // ============ CTO ============
  cto: {
    id: 'cto',
    category: 'market-equity',
    pool: 'semi-liquid',
    defaultReturn: {
      kind: 'scenario',
      pessimistic: 0.03,
      median: 0.07,
      optimistic: 0.1,
    },
    cap: null,
    lockIn: { kind: 'none' },
    taxRegime: {
      kind: 'pfu',
      rate: 0.128,
      socialCharges: PS_NEW, // total = 31.4%
    },
    source: SOURCES.cto,
  },

  // ============ Custom ============
  // Placeholder product. The actual rate, pool, and lock-in come from the user.
  custom: {
    id: 'custom',
    category: 'custom',
    pool: 'liquid', // default; the store can override per-user
    defaultReturn: { kind: 'fixed', rate: 0.04 },
    cap: null,
    lockIn: { kind: 'none' },
    taxRegime: { kind: 'custom-net' },
    source: {
      url: '',
      verifiedOn: '2026-05-15',
    },
  },
};

/**
 * Ordered list of products to display in the allocation UI.
 * Custom goes last and is visually distinct.
 */
export const PRODUCT_DISPLAY_ORDER: ProductId[] = [
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
  'custom',
];

/**
 * Helper: get the median rate for any product (the default the slider uses).
 * Used by the allocation page when displaying the default rate next to each slider.
 */
export function getDefaultRate(product: Product): number {
  return product.defaultReturn.kind === 'fixed'
    ? product.defaultReturn.rate
    : product.defaultReturn.median;
}
