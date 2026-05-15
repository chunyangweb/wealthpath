import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { TopBar } from '@/components/layout/TopBar';
import { useShellContext } from '@/components/layout/useShellContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { PRODUCTS, getDefaultRate } from '@/data/products.fr';
import { useAllocationStore } from '@/state/allocationStore';
import { useUserInputsStore } from '@/state/userInputsStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { sumMonthly } from '@/lib/utils/frequencyToMonthly';
import { computeProjection } from '@/lib/finance/projection';
import {
  buildProjectionProducts,
  getAllocatedStandardProducts,
  sumProductAmounts,
} from '@/lib/finance/allocationInputs';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_PIE_COLOR = 'hsl(92, 33%, 31%)';

// 12 shades across the sage-green / olive palette (excluding the darkest)
const PIE_COLORS = [
  DEFAULT_PIE_COLOR,
  'hsl(83, 28%, 49%)',
  'hsl(76, 34%, 67%)',
  'hsl(87, 22%, 40%)',
  'hsl(80, 20%, 60%)',
  'hsl(70, 30%, 76%)',
  'hsl(95, 25%, 38%)',
  'hsl(75, 15%, 55%)',
  'hsl(65, 38%, 72%)',
  'hsl(88, 35%, 35%)',
  'hsl(100, 20%, 44%)',
  'hsl(72, 28%, 80%)',
];

function pieColorAt(index: number): string {
  return PIE_COLORS[index % PIE_COLORS.length] ?? DEFAULT_PIE_COLOR;
}

// ---------- Sub-components ----------

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function KpiBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ---------- Page ----------

export function SummaryPage() {
  const { t } = useTranslation();
  const { onMenuClick } = useShellContext();
  const language = useSettingsStore((s) => s.language);
  const navigate = useNavigate();

  // Stores
  const startingBalance = useUserInputsStore((s) => s.startingBalance);
  const incomes = useUserInputsStore((s) => s.incomes);
  const recurringExpenses = useUserInputsStore((s) => s.recurringExpenses);
  const resetInputs = useUserInputsStore((s) => s.reset);

  const amounts = useAllocationStore((s) => s.amounts);
  const rateOverrides = useAllocationStore((s) => s.rateOverrides);
  const customCfg = useAllocationStore((s) => s.custom);
  const timelines = useAllocationStore((s) => s.timelines);
  const resetAllocation = useAllocationStore((s) => s.reset);

  const monthlyIncome = sumMonthly(incomes);
  const monthlyExpenses = sumMonthly(recurringExpenses);
  const monthlySavings = monthlyIncome - monthlyExpenses;

  const allocatedStandard = useMemo(
    () => getAllocatedStandardProducts(amounts),
    [amounts],
  );
  const hasCustom = customCfg.amount > 0;

  // ---------- Pie data ----------
  const pieData = useMemo(() => {
    const items: { id: string; name: string; amount: number; color: string }[] =
      [];
    allocatedStandard.forEach(([id, amount]) => {
      items.push({
        id,
        name: t(`allocation.products.${id}.name`),
        amount,
        color: pieColorAt(items.length),
      });
    });
    if (hasCustom) {
      items.push({
        id: 'custom',
        name: customCfg.name || t('allocation.custom.title'),
        amount: customCfg.amount,
        color: pieColorAt(items.length),
      });
    }
    return items;
  }, [allocatedStandard, hasCustom, customCfg.name, customCfg.amount, t]);

  const totalAllocated = pieData.reduce((s, p) => s + p.amount, 0);

  // ---------- 1-year projection (fixed horizon) ----------
  const oneYearResult = useMemo(() => {
    const productInputs = buildProjectionProducts({
      allocatedStandard,
      custom: customCfg,
      hasCustom,
      rateOverrides,
      timelines,
      today: TODAY,
    });
    const total = sumProductAmounts(productInputs);
    return computeProjection({
      startingBalance: startingBalance > 0 ? startingBalance : 10000,
      monthlySavings,
      totalAllocated: total,
      products: productInputs,
      horizonMonths: 12,
      today: TODAY,
    });
  }, [
    allocatedStandard,
    customCfg,
    hasCustom,
    rateOverrides,
    timelines,
    startingBalance,
    monthlySavings,
  ]);

  const gainPct =
    oneYearResult.finalNoInvestment > 0
      ? (
          ((oneYearResult.finalWithInvestment -
            oneYearResult.finalNoInvestment) /
            oneYearResult.finalNoInvestment) *
          100
        ).toFixed(1)
      : '0';

  // ---------- Reset ----------
  const [confirmReset, setConfirmReset] = useState(false);

  function handleReset() {
    resetInputs();
    resetAllocation();
    navigate('/');
  }

  return (
    <>
      <TopBar
        title={t('summary.title')}
        subtitle={t('summary.subtitle')}
        onMenuClick={onMenuClick}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-5">
          {/* ====== TOP ROW: situation + pie chart ====== */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* Situation — 2/5 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('summary.situation.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  <StatRow
                    label={t('summary.situation.balance')}
                    value={formatCurrency(startingBalance, language)}
                  />
                  <StatRow
                    label={t('summary.situation.income')}
                    value={formatCurrency(monthlyIncome, language)}
                  />
                  <StatRow
                    label={t('summary.situation.expenses')}
                    value={formatCurrency(monthlyExpenses, language)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pie chart — 3/5 */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{t('summary.allocation.chart_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('summary.allocation.none')}
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {pieData.map((entry) => (
                            <Cell
                              key={entry.id}
                              fill={entry.color}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const item = payload[0] as {
                              name: string;
                              value: number;
                              payload: { percent: number };
                            };
                            return (
                              <div className="rounded-xl border border-border bg-card px-3 py-2 text-[0.8125rem] shadow-sm">
                                <p className="font-semibold text-foreground">
                                  {item.name}
                                </p>
                                <p className="text-muted-foreground">
                                  {formatCurrency(item.value, language)}
                                </p>
                                <p className="text-muted-foreground">
                                  {(item.payload.percent * 100).toFixed(1)} %
                                </p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Custom legend */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                      {pieData.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.name}
                          </span>
                          <span className="text-xs font-medium tabular-nums text-foreground">
                            {totalAllocated > 0
                              ? ((item.amount / totalAllocated) * 100).toFixed(
                                  0,
                                )
                              : 0}{' '}
                            %
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ====== ALLOCATION DETAIL ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('summary.allocation.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {allocatedStandard.length === 0 && !hasCustom ? (
                <p className="text-sm text-muted-foreground">
                  {t('summary.allocation.none')}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {allocatedStandard.map(([id, amount], i) => {
                    const product = PRODUCTS[id];
                    const rate = rateOverrides[id] ?? getDefaultRate(product);
                    const timeline = timelines[id];
                    return (
                      <div
                        key={id}
                        className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor: pieColorAt(i),
                            }}
                          />
                          <span className="text-sm text-foreground">
                            {t(`allocation.products.${id}.name`)}
                          </span>
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-secondary-foreground">
                            {(rate * 100).toFixed(2).replace(/\.?0+$/, '')} %
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-left sm:justify-end sm:text-right">
                          {timeline && (
                            <span className="text-xs text-muted-foreground2">
                              {timeline.startDate}
                              {timeline.endDate ? ` → ${timeline.endDate}` : ''}
                            </span>
                          )}
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(amount, language)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {hasCustom && (
                    <div className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: pieColorAt(
                              allocatedStandard.length,
                            ),
                          }}
                        />
                        <span className="text-sm text-foreground">
                          {customCfg.name || t('allocation.custom.title')}
                        </span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-secondary-foreground">
                          {(customCfg.annualRate * 100)
                            .toFixed(2)
                            .replace(/\.?0+$/, '')}{' '}
                          %
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-left sm:justify-end sm:text-right">
                        {timelines['custom'] && (
                          <span className="text-xs text-muted-foreground2">
                            {timelines['custom'].startDate}
                            {timelines['custom'].endDate
                              ? ` → ${timelines['custom'].endDate}`
                              : ''}
                          </span>
                        )}
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(customCfg.amount, language)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ====== OUTCOME IN 1 YEAR ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('summary.projection.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiBox
                  label={t('summary.projection.with')}
                  value={formatCurrency(
                    oneYearResult.finalWithInvestment,
                    language,
                  )}
                  highlight
                />
                <KpiBox
                  label={t('summary.projection.without')}
                  value={formatCurrency(
                    oneYearResult.finalNoInvestment,
                    language,
                  )}
                />
                <KpiBox
                  label={t('summary.projection.interest')}
                  value={formatCurrency(
                    oneYearResult.totalInterestEarned,
                    language,
                  )}
                  highlight
                />
                <KpiBox
                  label={t('summary.projection.gain_pct')}
                  value={`+${gainPct} %`}
                  highlight
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ====== NAV ====== */}
        <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Link to="/simulation">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              {t('summary.actions.back')}
            </Button>
          </Link>

          {!confirmReset ? (
            <Button variant="outline" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" />
              {t('summary.actions.reset')}
            </Button>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">
                {t('summary.actions.reset_confirm')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReset(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                {t('summary.actions.reset_yes')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
