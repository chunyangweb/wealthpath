import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import type { Product } from '@/types/product';
import type { ProductTimeline } from '@/state/allocationStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Label } from '@/components/ui/Input';
import { PoolDot } from './PoolDot';
import { RateBadge } from './RateBadge';

type Props = {
  product: Product;
  amount: number;
  effectiveRate: number;
  isRateOverridden: boolean;
  sliderMax: number;
  timeline: ProductTimeline;
  onAmountChange: (amount: number) => void;
  onRateChange: (rate: number) => void;
  onRateReset: () => void;
  onTimelineChange: (t: ProductTimeline) => void;
};

/** Compute the earliest allowed end date given a product's lock-in rules. */
function minEndDate(product: Product, startDate: string): string {
  if (
    product.lockIn.kind === 'until-event' &&
    product.lockIn.event === '5-years' &&
    startDate
  ) {
    const d = new Date(startDate);
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().slice(0, 10);
  }
  return startDate;
}

export function ProductSlider({
  product,
  amount,
  effectiveRate,
  isRateOverridden,
  sliderMax,
  timeline,
  onAmountChange,
  onRateChange,
  onRateReset,
  onTimelineChange,
}: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const name = t(`allocation.products.${product.id}.name`);
  const cap = product.cap;
  const hasLockIn = product.lockIn.kind !== 'none';

  const lockInLabel =
    product.lockIn.kind === 'closure-on-withdrawal'
      ? t('allocation.lockin_pel')
      : product.lockIn.kind === 'until-event' &&
          product.lockIn.event === '5-years'
        ? t('allocation.lockin_pea')
        : product.lockIn.kind === 'until-event' &&
            product.lockIn.event === 'retirement'
          ? t('allocation.lockin_per')
          : '';

  const endDateMin = minEndDate(product, timeline.startDate);
  const endDateHint =
    product.lockIn.kind === 'until-event' && product.lockIn.event === '5-years'
      ? t('allocation.timeline.end_date_min_hint')
      : undefined;
  const startDateId = `${product.id}-start-date`;
  const endDateId = `${product.id}-end-date`;

  function handleStartDateChange(startDate: string) {
    const nextEndDateMin = minEndDate(product, startDate);
    const endDate =
      timeline.endDate && timeline.endDate < nextEndDateMin
        ? undefined
        : timeline.endDate;
    onTimelineChange({ ...timeline, startDate, endDate });
  }

  return (
    <div className="border-b border-border px-4 py-3.5 last:border-b-0">
      {/* Row 1: name + rate + amount */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PoolDot pool={product.pool} />
          <span
            className="truncate text-sm font-medium text-foreground"
            title={t(`allocation.products.${product.id}.info`)}
          >
            {name}
          </span>
          <RateBadge
            rate={effectiveRate}
            isOverride={isRateOverridden}
            onChange={onRateChange}
            onReset={onRateReset}
          />
          {hasLockIn && (
            <Lock
              className="h-3 w-3 shrink-0 text-muted-foreground2"
              aria-label={lockInLabel}
              role="img"
            />
          )}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(amount, language)}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={sliderMax}
        step={100}
        value={amount}
        onChange={(e) => onAmountChange(Number(e.target.value))}
        aria-label={`${name} allocation`}
      />

      <div className="mt-1 flex justify-between text-xs text-muted-foreground2">
        <span>{lockInLabel || t('allocation.pool.' + product.pool)}</span>
        <span className="tabular-nums">
          {cap === null
            ? t('allocation.no_cap')
            : `${t('allocation.cap')} ${formatCurrency(cap, language)}`}
        </span>
      </div>

      {/* Row 2: timeline inputs */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={startDateId} className="mb-1">
            {t('allocation.timeline.start_date')}
          </Label>
          <input
            id={startDateId}
            type="date"
            value={timeline.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
        <div>
          <Label htmlFor={endDateId} className="mb-1">
            {t('allocation.timeline.end_date_optional')}
            {endDateHint && (
              <span className="ml-1 text-muted-foreground2">
                ({endDateHint})
              </span>
            )}
          </Label>
          <input
            id={endDateId}
            type="date"
            value={timeline.endDate ?? ''}
            min={endDateMin}
            onChange={(e) =>
              onTimelineChange({
                ...timeline,
                endDate: e.target.value || undefined,
              })
            }
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
