import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { cn } from '@/lib/utils';

type Props = {
  totalAllocated: number;
  capitalToAllocate: number;
};

/**
 * Sticky-ish card showing the running total of allocations vs available capital.
 * Highlights over-allocation in red.
 */
export function AllocationTotalCard({
  totalAllocated,
  capitalToAllocate,
}: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const remaining = capitalToAllocate - totalAllocated;
  const isOver = remaining < 0;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-xs text-muted-foreground">
          {t('allocation.capital.total_allocated')}
        </p>
        <p className="text-lg font-semibold tabular-nums text-foreground">
          {formatCurrency(totalAllocated, language)}{' '}
          <span className="text-sm font-normal text-muted-foreground">
            / {formatCurrency(capitalToAllocate, language)}
          </span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">
          {isOver
            ? t('allocation.capital.over_allocated')
            : t('allocation.capital.remaining')}
        </p>
        <p
          className={cn(
            'text-lg font-semibold tabular-nums',
            isOver ? 'text-destructive' : 'text-primary',
          )}
        >
          {formatCurrency(Math.abs(remaining), language)}
        </p>
      </div>
    </div>
  );
}
