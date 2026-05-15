import type { Situation } from '@/lib/storage/schema';
import type { StandardProductId } from '@/state/allocationStore';
import { PRODUCTS } from '@/data/products.fr';

/**
 * Computes default allocation amounts for each (situation × profile) combination.
 *
 * Returns an object mapping ProductId → euro amount allocated.
 * Custom product is never auto-allocated (defaults to 0).
 *
 * Caps are enforced: if a profile suggests more than the product's cap, the
 * excess overflows to the next preferred product in that profile.
 */

export type ProfileId = 'prudent' | 'balanced' | 'dynamic';

/**
 * Percentage-based templates per situation+profile.
 * Sum of percentages = 100 within each template.
 * Only standard product IDs are used — custom is never auto-allocated.
 */
type Template = Partial<Record<StandardProductId, number>>;

const TEMPLATES: Record<Situation, Record<ProfileId, Template>> = {
  // --------------- STUDENT ---------------
  // Heavy emphasis on liquid regulated savings. No PER (no taxable income).
  student: {
    prudent: {
      'livret-a': 0.6,
      ldds: 0.2,
      lep: 0.2, // many students are eligible
    },
    balanced: {
      'livret-a': 0.45,
      ldds: 0.15,
      lep: 0.15,
      'livret-jeune': 0.05,
      'av-fonds-euros': 0.15,
      'av-uc': 0.05,
    },
    dynamic: {
      'livret-a': 0.3,
      lep: 0.15,
      'av-fonds-euros': 0.15,
      'av-uc': 0.25,
      pea: 0.15,
    },
  },

  // --------------- EMPLOYED (salarié) ---------------
  // Standard French personal-finance defaults.
  employed: {
    prudent: {
      'livret-a': 0.3,
      ldds: 0.1,
      'av-fonds-euros': 0.5,
      'av-uc': 0.1,
    },
    balanced: {
      'livret-a': 0.2,
      ldds: 0.05,
      'av-fonds-euros': 0.3,
      'av-uc': 0.2,
      pea: 0.2,
      per: 0.05,
    },
    dynamic: {
      'livret-a': 0.1,
      'av-fonds-euros': 0.15,
      'av-uc': 0.25,
      pea: 0.4,
      per: 0.1,
    },
  },

  // --------------- FREELANCE (indépendant) ---------------
  // Higher emergency buffer (variable income), strong PER weighting (higher caps for TNS).
  freelance: {
    prudent: {
      'livret-a': 0.35,
      ldds: 0.15,
      'av-fonds-euros': 0.4,
      'av-uc': 0.05,
      per: 0.05,
    },
    balanced: {
      'livret-a': 0.25,
      ldds: 0.1,
      'av-fonds-euros': 0.25,
      'av-uc': 0.15,
      pea: 0.15,
      per: 0.1,
    },
    dynamic: {
      'livret-a': 0.15,
      'av-fonds-euros': 0.15,
      'av-uc': 0.25,
      pea: 0.3,
      per: 0.15,
    },
  },
};

/**
 * Compute the suggested allocation in EUR for the given inputs.
 *
 * @param situation User's situation
 * @param profile Selected profile (prudent / balanced / dynamic)
 * @param totalAmount Total amount to allocate
 * @returns Map of standard product ID → EUR amount. Custom never auto-allocates.
 */
export function computeSuggestion(
  situation: Situation,
  profile: ProfileId,
  totalAmount: number,
): Record<StandardProductId, number> {
  const template = TEMPLATES[situation][profile];

  // Initialize output with 0 for every standard product
  const result: Record<StandardProductId, number> = {
    'livret-a': 0,
    ldds: 0,
    lep: 0,
    'livret-jeune': 0,
    cel: 0,
    pel: 0,
    'av-fonds-euros': 0,
    'av-uc': 0,
    pea: 0,
    per: 0,
    cto: 0,
  };

  if (totalAmount <= 0) return result;

  // Sort template entries by percentage (descending) so we fill biggest first.
  const entries = Object.entries(template) as [StandardProductId, number][];
  entries.sort((a, b) => b[1] - a[1]);

  // First pass: assign target amounts, respecting caps
  let overflow = 0;
  for (const [productId, percentage] of entries) {
    const target = totalAmount * percentage;
    const product = PRODUCTS[productId];
    const cap = product.cap;

    if (cap !== null && target > cap) {
      result[productId] = cap;
      overflow += target - cap;
    } else {
      result[productId] = target;
    }
  }

  // Second pass: distribute overflow to the largest no-cap product in the template
  if (overflow > 0) {
    const noCapTarget = entries.find(([id]) => PRODUCTS[id].cap === null);
    if (noCapTarget) {
      result[noCapTarget[0]] += overflow;
    } else {
      const first = entries[0];
      if (first) result[first[0]] += overflow;
    }
  }

  return result;
}
