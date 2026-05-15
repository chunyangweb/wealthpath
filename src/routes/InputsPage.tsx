import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Check } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { useShellContext } from '@/components/layout/useShellContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardSubtitle,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HelpText,
  Label,
  NumberInput,
  Select,
} from '@/components/ui/Input';
import { CashFlowRow } from '@/components/inputs/CashFlowRow';
import { useUserInputsStore } from '@/state/userInputsStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { sumMonthly } from '@/lib/utils/frequencyToMonthly';

/**
 * The Inputs page (M1).
 *
 * Single scrolling page with five sections:
 *   1. Profile (situation, household)
 *   2. Current balance
 *   3. Recurring incomes
 *   4. Recurring expenses
 *   5. One-off expenses
 *   6. Projection horizon
 *
 * Plus a sticky summary widget at the bottom showing monthly income/expense/savings.
 *
 * Every change persists to localStorage via the userInputsStore (debounced 500ms).
 * Hence the "Saved" indicator that flashes after edits.
 */
export function InputsPage() {
  const { t } = useTranslation();
  const { onMenuClick } = useShellContext();
  const language = useSettingsStore((s) => s.language);

  // Pull entire store state — this page touches almost all of it
  const inputs = useUserInputsStore();

  // Computed monthly figures for the summary widget
  const monthlyIncome = sumMonthly(inputs.incomes);
  const monthlyExpenses = sumMonthly(inputs.recurringExpenses);
  const monthlySavings = monthlyIncome - monthlyExpenses;

  return (
    <>
      <TopBar
        title={t('inputs.title')}
        subtitle={t('inputs.subtitle')}
        onMenuClick={onMenuClick}
        rightSlot={
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t('inputs.actions.saved')}
          </span>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-5">
          {/* ====== PROFILE ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inputs.profile.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="situation">
                    {t('inputs.profile.situation_label')}
                  </Label>
                  <Select
                    id="situation"
                    value={inputs.situation}
                    onChange={(e) =>
                      inputs.setSituation(
                        e.target.value as
                          | 'student'
                          | 'employed'
                          | 'freelance',
                      )
                    }
                  >
                    <option value="student">
                      {t('inputs.profile.situation_student')}
                    </option>
                    <option value="employed">
                      {t('inputs.profile.situation_employed')}
                    </option>
                    <option value="freelance">
                      {t('inputs.profile.situation_freelance')}
                    </option>
                  </Select>
                  <HelpText>{t('inputs.profile.situation_help')}</HelpText>
                </div>

                <div>
                  <Label htmlFor="household">
                    {t('inputs.profile.household_label')}
                  </Label>
                  <Select
                    id="household"
                    value={inputs.household}
                    onChange={(e) =>
                      inputs.setHousehold(
                        e.target.value as 'single' | 'couple',
                      )
                    }
                  >
                    <option value="single">
                      {t('inputs.profile.household_single')}
                    </option>
                    <option value="couple">
                      {t('inputs.profile.household_couple')}
                    </option>
                  </Select>
                  <HelpText>{t('inputs.profile.household_help')}</HelpText>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====== STARTING BALANCE ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inputs.balance.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Label htmlFor="balance">{t('inputs.balance.label')} (€)</Label>
                <NumberInput
                  id="balance"
                  value={
                    inputs.startingBalance === 0
                      ? undefined
                      : inputs.startingBalance
                  }
                  onValueChange={(n) => inputs.setStartingBalance(n ?? 0)}
                  placeholder={t('inputs.balance.placeholder')}
                  min={0}
                />
                <HelpText>{t('inputs.balance.help')}</HelpText>
              </div>
            </CardContent>
          </Card>

          {/* ====== INCOMES ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inputs.incomes.title')}</CardTitle>
              <CardSubtitle>{t('inputs.incomes.subtitle')}</CardSubtitle>
            </CardHeader>
            <CardContent>
              {inputs.incomes.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-background/30 py-6 text-center text-sm text-muted-foreground">
                  {t('inputs.incomes.empty')}
                </p>
              ) : (
                <div className="space-y-3">
                  {inputs.incomes.map((row) => (
                    <CashFlowRow
                      key={row.id}
                      row={row}
                      variant="recurring"
                      labelPlaceholder={t('inputs.incomes.placeholder_label')}
                      amountPlaceholder={t(
                        'inputs.incomes.placeholder_amount',
                      )}
                      onChange={(patch) => inputs.updateIncome(row.id, patch)}
                      onRemove={() => inputs.removeIncome(row.id)}
                    />
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={inputs.addIncome}
                className="mt-3"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('inputs.incomes.add')}
              </Button>
            </CardContent>
          </Card>

          {/* ====== RECURRING EXPENSES ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inputs.recurring_expenses.title')}</CardTitle>
              <CardSubtitle>
                {t('inputs.recurring_expenses.subtitle')}
              </CardSubtitle>
            </CardHeader>
            <CardContent>
              {inputs.recurringExpenses.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-background/30 py-6 text-center text-sm text-muted-foreground">
                  {t('inputs.recurring_expenses.empty')}
                </p>
              ) : (
                <div className="space-y-3">
                  {inputs.recurringExpenses.map((row) => (
                    <CashFlowRow
                      key={row.id}
                      row={row}
                      variant="recurring"
                      labelPlaceholder={t(
                        'inputs.recurring_expenses.placeholder_label',
                      )}
                      amountPlaceholder={t(
                        'inputs.recurring_expenses.placeholder_amount',
                      )}
                      onChange={(patch) =>
                        inputs.updateRecurringExpense(row.id, patch)
                      }
                      onRemove={() => inputs.removeRecurringExpense(row.id)}
                    />
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={inputs.addRecurringExpense}
                className="mt-3"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('inputs.recurring_expenses.add')}
              </Button>
            </CardContent>
          </Card>

          {/* ====== ONE-OFF EXPENSES ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inputs.one_off_expenses.title')}</CardTitle>
              <CardSubtitle>
                {t('inputs.one_off_expenses.subtitle')}
              </CardSubtitle>
            </CardHeader>
            <CardContent>
              {inputs.oneOffExpenses.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-background/30 py-6 text-center text-sm text-muted-foreground">
                  {t('inputs.one_off_expenses.empty')}
                </p>
              ) : (
                <div className="space-y-3">
                  {inputs.oneOffExpenses.map((row) => (
                    <CashFlowRow
                      key={row.id}
                      row={row}
                      variant="one-off"
                      labelPlaceholder={t(
                        'inputs.one_off_expenses.placeholder_label',
                      )}
                      amountPlaceholder={t(
                        'inputs.one_off_expenses.placeholder_amount',
                      )}
                      onChange={(patch) =>
                        inputs.updateOneOffExpense(row.id, patch)
                      }
                      onRemove={() => inputs.removeOneOffExpense(row.id)}
                    />
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={inputs.addOneOffExpense}
                className="mt-3"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('inputs.one_off_expenses.add')}
              </Button>
            </CardContent>
          </Card>

          {/* ====== SUMMARY ====== */}
          <Card className="bg-background-soft">
            <CardHeader>
              <CardTitle>{t('inputs.summary.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <SummaryStat
                  label={t('inputs.summary.starting_balance')}
                  value={formatCurrency(inputs.startingBalance, language)}
                />
                <SummaryStat
                  label={t('inputs.summary.monthly_income')}
                  value={formatCurrency(monthlyIncome, language)}
                />
                <SummaryStat
                  label={t('inputs.summary.monthly_expenses')}
                  value={formatCurrency(monthlyExpenses, language)}
                />
                <SummaryStat
                  label={t('inputs.summary.monthly_savings')}
                  value={formatCurrency(monthlySavings, language)}
                  highlight={monthlySavings >= 0 ? 'positive' : 'negative'}
                />
              </div>
            </CardContent>
          </Card>

          {/* ====== CONTINUE BUTTON ====== */}
          <div className="flex justify-end pt-2">
            <Link to="/allocation">
              <Button size="lg">
                {t('inputs.actions.continue')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'positive' | 'negative';
}) {
  const valueColor =
    highlight === 'positive'
      ? 'text-primary'
      : highlight === 'negative'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}
