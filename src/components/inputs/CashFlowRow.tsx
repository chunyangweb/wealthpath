import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Input, NumberInput, Select, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CashFlow, Frequency } from '@/lib/storage/schema';

type Props = {
  row: CashFlow;
  /** When 'one-off', frequency selector is hidden (always one-off). */
  variant: 'recurring' | 'one-off';
  labelPlaceholder: string;
  amountPlaceholder: string;
  onChange: (patch: Partial<CashFlow>) => void;
  onRemove: () => void;
};

const FREQUENCIES: Frequency[] = ['monthly', 'weekly', 'yearly', 'daily'];

/**
 * Editable cashflow row used by IncomeList, RecurringExpenseList, OneOffExpenseList.
 *
 * Layout on desktop: label | amount | frequency | startDate | endDate | trash
 * Layout on mobile: stacked vertically, trash floats top-right.
 */
export function CashFlowRow({
  row,
  variant,
  labelPlaceholder,
  amountPlaceholder,
  onChange,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  const isOneOff = variant === 'one-off';

  return (
    <div className="min-w-0 rounded-md border border-border bg-background/40 p-3">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-12">
        {/* Label */}
        <div className="min-w-0 sm:col-span-3">
          <Label htmlFor={`label-${row.id}`}>{t('inputs.row.label')}</Label>
          <Input
            id={`label-${row.id}`}
            value={row.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={labelPlaceholder}
            maxLength={80}
          />
        </div>

        {/* Amount */}
        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor={`amount-${row.id}`}>
            {t('inputs.row.amount')} (€)
          </Label>
          <NumberInput
            id={`amount-${row.id}`}
            value={row.amount === 0 ? undefined : row.amount}
            onValueChange={(n) => onChange({ amount: n ?? 0 })}
            placeholder={amountPlaceholder}
            min={0}
          />
        </div>

        {/* Frequency (hidden for one-off — it's implicitly 'one-off') */}
        {!isOneOff && (
          <div className="min-w-0 sm:col-span-2">
            <Label htmlFor={`freq-${row.id}`}>
              {t('inputs.row.frequency')}
            </Label>
            <Select
              id={`freq-${row.id}`}
              value={row.frequency}
              onChange={(e) =>
                onChange({ frequency: e.target.value as Frequency })
              }
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {t(`inputs.frequency.${f}`)}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Start date */}
        <div
          className={
            isOneOff ? 'min-w-0 sm:col-span-3' : 'min-w-0 sm:col-span-2'
          }
        >
          <Label htmlFor={`start-${row.id}`}>
            {isOneOff
              ? t('inputs.row.label') + ' — date'
              : t('inputs.row.start_date')}
          </Label>
          <Input
            id={`start-${row.id}`}
            type="date"
            value={row.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </div>

        {/* End date (recurring only) */}
        {!isOneOff && (
          <div className="min-w-0 sm:col-span-2">
            <Label htmlFor={`end-${row.id}`}>
              {t('inputs.row.end_date_optional')}
            </Label>
            <Input
              id={`end-${row.id}`}
              type="date"
              value={row.endDate ?? ''}
              onChange={(e) =>
                onChange({ endDate: e.target.value || undefined })
              }
            />
          </div>
        )}

        {/* Remove button */}
        <div
          className={
            isOneOff
              ? 'flex sm:col-span-4 sm:items-end'
              : 'flex sm:col-span-1 sm:items-end'
          }
        >
          <div className="flex h-full items-end justify-end pb-0.5 sm:justify-center sm:pb-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
              aria-label={t('inputs.row.remove')}
              title={t('inputs.row.remove')}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
