type FormatOptions = {
  /** Use compact notation (e.g. €12k, €1.2M) — for axis ticks. */
  compact?: boolean;
};

/**
 * Format a EUR amount using the appropriate locale.
 * Always returns a string with the € symbol.
 *
 * - 'fr' → '1 234 €' (non-breaking space, no decimals for whole euros)
 * - 'en' → '€1,234'
 *
 * If the amount has cents, we show them; otherwise we round to whole euros
 * to avoid pretending we know things to the cent.
 */
export function formatCurrency(
  amount: number,
  locale: 'fr' | 'en' = 'fr',
  options: FormatOptions = {},
): string {
  if (!Number.isFinite(amount)) return '—';

  const formatLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';

  if (options.compact) {
    return new Intl.NumberFormat(formatLocale, {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumSignificantDigits: 3,
    }).format(amount);
  }

  const hasDecimals = Math.abs(amount - Math.round(amount)) > 0.001;

  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
}
