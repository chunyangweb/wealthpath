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
import type { ProjectionPoint } from '@/lib/finance/projection';
import { useSettingsStore } from '@/state/settingsStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useMediaQuery } from '@/lib/utils/useMediaQuery';

// Palette position 6 (medium-dark sage) for the "with investment" line;
// position 2 (very light olive) for the muted "without" baseline.
const COLOR_WITH = 'hsl(87, 31%, 39%)'; // #728545
const COLOR_WITH_FILL = 'hsl(83, 28%, 68%)'; // lighter sage fill
const COLOR_WITHOUT = 'hsl(70, 25%, 73%)'; // pale olive — clearly subordinate

type KpiCardProps = { label: string; value: string; highlight?: boolean };

function KpiCard({ label, value, highlight }: KpiCardProps) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-3 sm:px-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 break-words text-base font-semibold tabular-nums sm:text-lg ${
          highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type Props = {
  points: ProjectionPoint[];
  finalNoInvestment: number;
  finalWithInvestment: number;
  totalInterestEarned: number;
  horizonYears: number;
};

export function ProjectionChart({
  points,
  finalNoInvestment,
  finalWithInvestment,
  totalInterestEarned,
  horizonYears,
}: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const isCompact = useMediaQuery('(max-width: 640px)');

  // Include enough points for smooth tooltip hovering at the right granularity:
  // ≤2 years → every month, 3 years → every quarter, 5-10 years → every 6 months.
  // X-axis only renders text for points whose `label` is non-empty.
  const horizonMonths = points.length - 1;
  const tooltipStep = horizonMonths <= 24 ? 1 : horizonMonths <= 36 ? 3 : 6;

  const chartData = useMemo(
    () => points.filter((p) => p.monthIndex % tooltipStep === 0),
    [points, tooltipStep],
  );

  // Narrow the Y-axis to the actual data range so the gap between the two
  // series is clearly visible rather than compressed toward the bottom.
  const yDomain = useMemo((): [number, number] => {
    if (chartData.length === 0) return [0, 100];
    const minVal = Math.min(...chartData.map((d) => d.noInvestment));
    const maxVal = Math.max(...chartData.map((d) => d.withInvestment));
    const range = Math.max(maxVal - minVal, maxVal * 0.02);
    const pad = range * 0.15;
    return [
      Math.max(0, Math.floor((minVal - pad) / 100) * 100),
      Math.ceil((maxVal + pad) / 100) * 100,
    ];
  }, [chartData]);

  const yFormatter = (v: number) =>
    formatCurrency(v, language, { compact: true });
  const tooltipFormatter = (v: number) => formatCurrency(v, language);

  const gainPct =
    finalNoInvestment > 0
      ? (
          ((finalWithInvestment - finalNoInvestment) / finalNoInvestment) *
          100
        ).toFixed(1)
      : '0';

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label={t('simulation.projection.kpi_with', { years: horizonYears })}
          value={formatCurrency(finalWithInvestment, language)}
          highlight
        />
        <KpiCard
          label={t('simulation.projection.kpi_without', {
            years: horizonYears,
          })}
          value={formatCurrency(finalNoInvestment, language)}
        />
        <KpiCard
          label={t('simulation.projection.kpi_interest')}
          value={formatCurrency(totalInterestEarned, language)}
          highlight
        />
        <KpiCard
          label={t('simulation.projection.kpi_gain_pct')}
          value={`+${gainPct} %`}
          highlight
        />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={isCompact ? 250 : 320}>
        <AreaChart
          data={chartData}
          margin={
            isCompact
              ? { top: 8, right: 0, bottom: 0, left: -10 }
              : { top: 8, right: 8, bottom: 0, left: 8 }
          }
        >
          <defs>
            <linearGradient id="gradWith" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOR_WITH_FILL} stopOpacity={0.8} />
              <stop
                offset="95%"
                stopColor={COLOR_WITH_FILL}
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="gradWithout" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOR_WITHOUT} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLOR_WITHOUT} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(75, 24%, 89%)" />

          <XAxis
            dataKey="label"
            tick={{
              fontSize: isCompact ? 10 : 11,
              fill: 'hsl(105, 6%, 57%)',
            }}
            tickLine={false}
            axisLine={false}
            minTickGap={isCompact ? 20 : 5}
          />

          <YAxis
            domain={yDomain}
            tickFormatter={yFormatter}
            tick={{
              fontSize: isCompact ? 10 : 11,
              fill: 'hsl(105, 6%, 57%)',
            }}
            tickLine={false}
            axisLine={false}
            width={isCompact ? 50 : 72}
          />

          <Tooltip
            formatter={(value: number, name: string) => [
              tooltipFormatter(value),
              name === 'withInvestment'
                ? t('simulation.projection.series_with')
                : t('simulation.projection.series_without'),
            ]}
            labelFormatter={(_, payload) =>
              (payload as { payload: { tooltipLabel: string } }[])?.[0]?.payload
                ?.tooltipLabel ?? ''
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
              value === 'withInvestment'
                ? t('simulation.projection.series_with')
                : t('simulation.projection.series_without')
            }
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: isCompact ? '0.75rem' : '0.8125rem',
              paddingTop: '8px',
            }}
          />

          {/* "Without investment" area — rendered first (behind) */}
          <Area
            type="monotone"
            dataKey="noInvestment"
            stroke={COLOR_WITHOUT}
            strokeWidth={1.5}
            fill="url(#gradWithout)"
            dot={false}
            strokeDasharray="4 3"
          />

          {/* "With investment" area — rendered on top */}
          <Area
            type="monotone"
            dataKey="withInvestment"
            stroke={COLOR_WITH}
            strokeWidth={2}
            fill="url(#gradWith)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-muted-foreground2">
        {t('simulation.projection.disclaimer')}
      </p>
    </div>
  );
}
