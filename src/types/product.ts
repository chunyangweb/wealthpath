/**
 * Type definitions for the product catalog.
 *
 * Each product describes: how its returns are modeled, how it's taxed, when
 * the user can access the money, and any caps that limit allocation.
 *
 * The shapes below are intentionally explicit (discriminated unions) so that
 * the projection and liquidity engines in M3/M4 can branch on `kind` and have
 * TypeScript verify they handled every case.
 */

// ---------- Identifiers ----------
export type ProductId =
  | 'livret-a'
  | 'ldds'
  | 'lep'
  | 'livret-jeune'
  | 'cel'
  | 'pel'
  | 'av-fonds-euros'
  | 'av-uc'
  | 'pea'
  | 'per'
  | 'cto'
  | 'custom';

// ---------- Liquidity pool the product belongs to ----------
export type LiquidityPool = 'liquid' | 'semi-liquid' | 'locked';

// ---------- How returns are modeled ----------
// Fixed: a single rate (livrets, PEL).
// Scenario: three rates for market-exposed products (PEA, UC, CTO).
export type ReturnModel =
  | { kind: 'fixed'; rate: number }
  | {
      kind: 'scenario';
      pessimistic: number;
      median: number;
      optimistic: number;
    };

// ---------- Lock-in description (for liquidity engine in M4) ----------
export type LockIn =
  | { kind: 'none' }
  | { kind: 'closure-on-withdrawal' } // PEL
  | { kind: 'until-event'; event: '5-years' | 'retirement' };

// ---------- Tax regime (for engine in M3) ----------
export type TaxRegime =
  | { kind: 'tax-free' } // Livrets
  | { kind: 'pfu'; rate: number; socialCharges: number } // CTO, PEL
  | { kind: 'pea'; preFiveYearsPfu: number; postFiveYearsPs: number }
  | {
      kind: 'assurance-vie';
      preEightYearsPfu: number;
      postEightYearsAllowance: { single: number; couple: number };
      postEightYearsIr: number;
      ps: number;
    }
  | {
      kind: 'per-deductible-entry';
      gainsPfu: number;
      ps: number;
    }
  | { kind: 'custom-net' }; // user-defined product treats rate as net

// ---------- The full product definition ----------
export type Product = {
  id: ProductId;
  category:
    | 'liquid-regulated'
    | 'liquid-tax'
    | 'market-stable'
    | 'market-equity'
    | 'retirement'
    | 'custom';
  pool: LiquidityPool;
  defaultReturn: ReturnModel;
  /** Maximum amount the user can put in this product. null = no cap. */
  cap: number | null;
  lockIn: LockIn;
  taxRegime: TaxRegime;
  /** Source URL + the date we last verified this product's parameters. */
  source: { url: string; verifiedOn: string };
};
