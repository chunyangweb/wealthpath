import { useTranslation } from 'react-i18next';
import type {
  CustomProductConfig,
  ProductTimeline,
} from '@/state/allocationStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Label, Input, NumberInput, Select } from '@/components/ui/Input';

type Props = {
  custom: CustomProductConfig;
  sliderMax: number;
  timeline: ProductTimeline;
  onChange: (patch: Partial<CustomProductConfig>) => void;
  onTimelineChange: (t: ProductTimeline) => void;
};

/**
 * Custom product editor.
 * Different layout from regular sliders: it has editable name, rate, and pool fields.
 * Tinted background so the user knows this product is user-defined.
 */
export function CustomProductSlider({
  custom,
  sliderMax,
  timeline,
  onChange,
  onTimelineChange,
}: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const startDateId = 'custom-product-start-date';
  const endDateId = 'custom-product-end-date';

  function handleStartDateChange(startDate: string) {
    const endDate =
      timeline.endDate && timeline.endDate < startDate
        ? undefined
        : timeline.endDate;
    onTimelineChange({ ...timeline, startDate, endDate });
  }

  return (
    <div className="border-b border-border bg-background-soft/60 px-4 py-4 last:border-b-0">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {t('allocation.custom.title')}
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(custom.amount, language)}
        </span>
      </div>

      {/* Editable fields */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="custom-name" className="sm:min-h-8">
            {t('allocation.custom.name_label')}
          </Label>
          <Input
            id="custom-name"
            value={custom.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={t('allocation.custom.label_placeholder')}
            maxLength={80}
          />
        </div>
        <div>
          <Label htmlFor="custom-rate" className="sm:min-h-8">
            {t('allocation.custom.rate_label')}
          </Label>
          <NumberInput
            id="custom-rate"
            value={custom.annualRate * 100}
            onValueChange={(n) => onChange({ annualRate: (n ?? 0) / 100 })}
            min={-50}
            max={100}
          />
        </div>
        <div>
          <Label htmlFor="custom-pool" className="sm:min-h-8">
            {t('allocation.custom.lockin_label')}
          </Label>
          <Select
            id="custom-pool"
            value={custom.pool}
            onChange={(e) =>
              onChange({ pool: e.target.value as 'liquid' | 'locked' })
            }
          >
            <option value="liquid">
              {t('allocation.custom.lockin_liquid')}
            </option>
            <option value="locked">
              {t('allocation.custom.lockin_locked')}
            </option>
          </Select>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={sliderMax || 50000}
        step={100}
        value={custom.amount}
        onChange={(e) => onChange({ amount: Number(e.target.value) })}
        aria-label="Custom product allocation"
      />

      <p className="mt-1 text-xs text-muted-foreground2">
        {t('allocation.custom.help')}
      </p>

      {/* Timeline inputs */}
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
          </Label>
          <input
            id={endDateId}
            type="date"
            value={timeline.endDate ?? ''}
            min={timeline.startDate}
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
