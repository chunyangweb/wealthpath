import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { LiquidityPoint } from '@/lib/finance/liquidity';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { cn } from '@/lib/utils';

// Three picks from the palette image — positions 7, 5, 3 (dark → light),
// excluding the darkest swatch. Liquid = richest, Locked = most muted.
const COLOR_LIQUID = 'hsl(92, 33%, 31%)'; // dark olive-sage (#556b34)
const COLOR_LIQUID_FILL = 'hsl(92, 33%, 54%)';
const COLOR_SEMI = 'hsl(83, 28%, 49%)'; // medium sage (#93a05a)
const COLOR_SEMI_FILL = 'hsl(83, 28%, 68%)';
const COLOR_LOCKED = 'hsl(76, 34%, 67%)'; // light olive (#c3ca8e)
const COLOR_LOCKED_FILL = 'hsl(76, 34%, 82%)';

type KpiCardProps = {
  label: string;
  value: string;
  dotColor: string;
  className?: string;
};

function KpiCard({ label, value, dotColor, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-border bg-card px-4 py-3',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 break-words text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

type Props = {
  points: LiquidityPoint[];
  finalLiquid: number;
  finalSemiLiquid: number;
  finalLocked: number;
};

export function LiquidityChart({
  points,
  finalLiquid,
  finalSemiLiquid,
  finalLocked,
}: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  // Include enough points for smooth tooltip hovering at the right granularity:
  // ≤2 years → every month, 3 years → every quarter, 5-10 years → every 6 months.
  // X-axis only renders text for points whose `label` is non-empty.
  const horizonMonths = points.length - 1;
  const tooltipStep = horizonMonths <= 24 ? 1 : horizonMonths <= 36 ? 3 : 6;

  const chartData = useMemo(
    () => points.filter((p) => p.monthIndex % tooltipStep === 0),
    [points, tooltipStep],
  );

  const yFormatter = (v: number) =>
    formatCurrency(v, language, { compact: true });

  return (
    <div className="min-w-0 space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard
          label={t('simulation.liquidity.pool_liquid')}
          value={formatCurrency(finalLiquid, language)}
          dotColor={COLOR_LIQUID}
        />
        <KpiCard
          label={t('simulation.liquidity.pool_semi')}
          value={formatCurrency(finalSemiLiquid, language)}
          dotColor={COLOR_SEMI}
        />
        <KpiCard
          label={t('simulation.liquidity.pool_locked')}
          value={formatCurrency(finalLocked, language)}
          dotColor={COLOR_LOCKED}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Stacked area chart */}
      <div className="min-w-0">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <defs>
              <linearGradient id="gradLiquid" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLOR_LIQUID_FILL}
                  stopOpacity={0.9}
                />
                <stop
                  offset="95%"
                  stopColor={COLOR_LIQUID_FILL}
                  stopOpacity={0.65}
                />
              </linearGradient>
              <linearGradient id="gradSemi" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLOR_SEMI_FILL}
                  stopOpacity={0.9}
                />
                <stop
                  offset="95%"
                  stopColor={COLOR_SEMI_FILL}
                  stopOpacity={0.65}
                />
              </linearGradient>
              <linearGradient id="gradLocked" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLOR_LOCKED_FILL}
                  stopOpacity={0.9}
                />
                <stop
                  offset="95%"
                  stopColor={COLOR_LOCKED_FILL}
                  stopOpacity={0.65}
                />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(75, 24%, 89%)" />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(105, 6%, 57%)' }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tickFormatter={yFormatter}
              tick={{ fontSize: 11, fill: 'hsl(105, 6%, 57%)' }}
              tickLine={false}
              axisLine={false}
              width={72}
            />

            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value, language),
                name === 'liquid'
                  ? t('simulation.liquidity.pool_liquid')
                  : name === 'semiLiquid'
                    ? t('simulation.liquidity.pool_semi')
                    : t('simulation.liquidity.pool_locked'),
              ]}
              labelFormatter={(_, payload) =>
                (payload as { payload: { tooltipLabel: string } }[])?.[0]
                  ?.payload?.tooltipLabel ?? ''
              }
              labelStyle={{ fontWeight: 600, color: 'hsl(120, 12%, 20%)' }}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid hsl(75, 24%, 89%)',
                fontSize: '0.8125rem',
              }}
            />

            <Legend
              formatter={(value) =>
                value === 'liquid'
                  ? t('simulation.liquidity.pool_liquid')
                  : value === 'semiLiquid'
                    ? t('simulation.liquidity.pool_semi')
                    : t('simulation.liquidity.pool_locked')
              }
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '0.8125rem', paddingTop: '8px' }}
            />

            {/* Liquid — bottom layer */}
            <Area
              type="monotone"
              dataKey="liquid"
              stackId="1"
              stroke={COLOR_LIQUID}
              strokeWidth={1.5}
              fill="url(#gradLiquid)"
              dot={false}
            />

            {/* Semi-liquid — middle layer */}
            <Area
              type="monotone"
              dataKey="semiLiquid"
              stackId="1"
              stroke={COLOR_SEMI}
              strokeWidth={1.5}
              fill="url(#gradSemi)"
              dot={false}
            />

            {/* Locked — top layer */}
            <Area
              type="monotone"
              dataKey="locked"
              stackId="1"
              stroke={COLOR_LOCKED}
              strokeWidth={1.5}
              fill="url(#gradLocked)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground2">
        {t('simulation.liquidity.disclaimer')}
      </p>
    </div>
  );
}
