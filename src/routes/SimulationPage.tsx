import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Pencil } from 'lucide-react';

import { TopBar } from '@/components/layout/TopBar';
import { useShellContext } from '@/components/layout/useShellContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardSubtitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { PRODUCTS, getDefaultRate } from '@/data/products.fr';
import { useAllocationStore, type StandardProductId } from '@/state/allocationStore';
import { useUserInputsStore } from '@/state/userInputsStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { PoolDot } from '@/components/allocation/PoolDot';
import { computeProjection, type ProductProjectionInput } from '@/lib/finance/projection';
import { computeLiquidity, type LiquidityProductInput } from '@/lib/finance/liquidity';
import { ProjectionChart } from '@/components/simulation/ProjectionChart';
import { LiquidityChart } from '@/components/simulation/LiquidityChart';
import { sumMonthly } from '@/lib/utils/frequencyToMonthly';

const TODAY = new Date().toISOString().slice(0, 10);

export function SimulationPage() {
  const { t } = useTranslation();
  const { onMenuClick } = useShellContext();
  const language = useSettingsStore((s) => s.language);

  const amounts = useAllocationStore((s) => s.amounts);
  const rateOverrides = useAllocationStore((s) => s.rateOverrides);
  const customCfg = useAllocationStore((s) => s.custom);
  const timelines = useAllocationStore((s) => s.timelines);

  const startingBalance = useUserInputsStore((s) => s.startingBalance);
  const incomes = useUserInputsStore((s) => s.incomes);
  const recurringExpenses = useUserInputsStore((s) => s.recurringExpenses);
  const horizonYears = useUserInputsStore((s) => s.horizonYears);
  const setHorizonYears = useUserInputsStore((s) => s.setHorizonYears);

  const monthlySavings = sumMonthly(incomes) - sumMonthly(recurringExpenses);

  // Collect allocated products for summary display
  const allocatedStandard = (
    Object.entries(amounts) as [StandardProductId, number][]
  ).filter(([, amount]) => amount > 0);
  const hasCustom = customCfg.amount > 0;

  // Build projection inputs
  const projectionResult = useMemo(() => {
    const productInputs: ProductProjectionInput[] = [];

    for (const [id, amount] of allocatedStandard) {
      if (amount <= 0) continue;
      const product = PRODUCTS[id];
      const rate = rateOverrides[id] ?? getDefaultRate(product);
      const timeline = timelines[id];
      productInputs.push({
        id,
        amount,
        annualRate: rate,
        startDate: timeline?.startDate ?? TODAY,
        endDate: timeline?.endDate,
      });
    }

    if (hasCustom) {
      const timeline = timelines['custom'];
      productInputs.push({
        id: 'custom',
        amount: customCfg.amount,
        annualRate: customCfg.annualRate,
        startDate: timeline?.startDate ?? TODAY,
        endDate: timeline?.endDate,
      });
    }

    const totalAllocated = productInputs.reduce((s, p) => s + p.amount, 0);

    return computeProjection({
      startingBalance: startingBalance > 0 ? startingBalance : 10000,
      monthlySavings,
      totalAllocated,
      products: productInputs,
      horizonMonths: horizonYears * 12,
      today: TODAY,
    });
  }, [
    amounts,
    rateOverrides,
    customCfg,
    timelines,
    startingBalance,
    monthlySavings,
    horizonYears,
    // allocatedStandard and hasCustom are derived, no need to list separately
  ]);

  // Build liquidity inputs (same products, adds pool + lockIn for classification)
  const liquidityResult = useMemo(() => {
    const productInputs: LiquidityProductInput[] = [];

    for (const [id, amount] of allocatedStandard) {
      if (amount <= 0) continue;
      const product = PRODUCTS[id];
      const rate = rateOverrides[id] ?? getDefaultRate(product);
      const timeline = timelines[id];
      productInputs.push({
        id,
        amount,
        annualRate: rate,
        startDate: timeline?.startDate ?? TODAY,
        endDate: timeline?.endDate,
        pool: product.pool,
        lockIn: product.lockIn,
      });
    }

    if (hasCustom) {
      const timeline = timelines['custom'];
      productInputs.push({
        id: 'custom',
        amount: customCfg.amount,
        annualRate: customCfg.annualRate,
        startDate: timeline?.startDate ?? TODAY,
        endDate: timeline?.endDate,
        pool: customCfg.pool,
        lockIn: { kind: 'none' },
      });
    }

    const totalAllocated = productInputs.reduce((s, p) => s + p.amount, 0);

    return computeLiquidity({
      startingBalance: startingBalance > 0 ? startingBalance : 10000,
      monthlySavings,
      totalAllocated,
      products: productInputs,
      horizonMonths: horizonYears * 12,
      today: TODAY,
    });
  }, [
    amounts,
    rateOverrides,
    customCfg,
    timelines,
    startingBalance,
    monthlySavings,
    horizonYears,
  ]);

  return (
    <>
      <TopBar
        title={t('simulation.title')}
        subtitle={t('simulation.subtitle')}
        onMenuClick={onMenuClick}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-5">
          {/* ====== ALLOCATION SUMMARY ====== */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('simulation.allocation_summary')}</CardTitle>
                <Link to="/allocation">
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                    {t('simulation.modify')}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {allocatedStandard.length === 0 && !hasCustom ? (
                <p className="text-sm text-muted-foreground">
                  {t('simulation.no_allocation')}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {allocatedStandard.map(([id, amount]) => {
                    const product = PRODUCTS[id];
                    const rate = rateOverrides[id] ?? getDefaultRate(product);
                    const timeline = timelines[id];
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <PoolDot pool={product.pool} />
                          <span className="text-sm text-foreground">
                            {t(`allocation.products.${id}.name`)}
                          </span>
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-secondary-foreground">
                            {(rate * 100).toFixed(2).replace(/\.?0+$/, '')} %
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-right">
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
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <PoolDot pool={customCfg.pool} />
                        <span className="text-sm text-foreground">
                          {customCfg.name || t('allocation.custom.title')}
                        </span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-secondary-foreground">
                          {(customCfg.annualRate * 100).toFixed(2).replace(/\.?0+$/, '')} %
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
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

          {/* ====== SIMULATION HORIZON ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('simulation.horizon.title')}</CardTitle>
              <CardSubtitle>{t('simulation.horizon.subtitle')}</CardSubtitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 5, 10].map((years) => (
                  <button
                    key={years}
                    type="button"
                    onClick={() => setHorizonYears(years)}
                    className={`rounded-md px-4 py-2 text-sm transition-colors ${
                      horizonYears === years
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {years === 1
                      ? t('simulation.horizon.one_year')
                      : `${years} ${t('simulation.horizon.years_label')}`}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ====== PROJECTION (M3) ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('simulation.projection.title')}</CardTitle>
              <CardSubtitle>{t('simulation.projection.subtitle')}</CardSubtitle>
            </CardHeader>
            <CardContent>
              <ProjectionChart
                points={projectionResult.points}
                finalNoInvestment={projectionResult.finalNoInvestment}
                finalWithInvestment={projectionResult.finalWithInvestment}
                totalInterestEarned={projectionResult.totalInterestEarned}
                horizonYears={horizonYears}
              />
            </CardContent>
          </Card>

          {/* ====== LIQUIDITY (M4) ====== */}
          <Card>
            <CardHeader>
              <CardTitle>{t('simulation.liquidity.title')}</CardTitle>
              <CardSubtitle>{t('simulation.liquidity.subtitle')}</CardSubtitle>
            </CardHeader>
            <CardContent>
              <LiquidityChart
                points={liquidityResult.points}
                finalLiquid={liquidityResult.finalLiquid}
                finalSemiLiquid={liquidityResult.finalSemiLiquid}
                finalLocked={liquidityResult.finalLocked}
              />
            </CardContent>
          </Card>
        </div>

        {/* ====== NAV BUTTONS ====== */}
        <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Link to="/allocation">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              {t('simulation.actions.back')}
            </Button>
          </Link>
          <Link to="/summary">
            <Button>
              {t('simulation.actions.continue')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
