import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';

import { TopBar } from '@/components/layout/TopBar';
import { useShellContext } from '@/components/layout/useShellContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { ProfileSelector } from '@/components/allocation/ProfileSelector';
import { ProductSlider } from '@/components/allocation/ProductSlider';
import { CustomProductSlider } from '@/components/allocation/CustomProductSlider';
import { AllocationTotalCard } from '@/components/allocation/AllocationTotalCard';

import {
  PRODUCTS,
  PRODUCT_DISPLAY_ORDER,
  getDefaultRate,
} from '@/data/products.fr';
import {
  useAllocationStore,
  type StandardProductId,
  type ProductTimeline,
} from '@/state/allocationStore';
import { useUserInputsStore } from '@/state/userInputsStore';
import { useSettingsStore } from '@/state/settingsStore';
import { computeSuggestion, type ProfileId } from '@/lib/finance/suggestion';
import { formatCurrency } from '@/lib/utils/formatCurrency';

const TODAY = new Date().toISOString().slice(0, 10);
const DEFAULT_TIMELINE: ProductTimeline = { startDate: TODAY };

export function AllocationPage() {
  const { t } = useTranslation();
  const { onMenuClick } = useShellContext();
  const language = useSettingsStore((s) => s.language);

  const situation = useUserInputsStore((s) => s.situation);
  const startingBalance = useUserInputsStore((s) => s.startingBalance);
  const capitalToAllocate = startingBalance > 0 ? startingBalance : 10000;

  const amounts = useAllocationStore((s) => s.amounts);
  const rateOverrides = useAllocationStore((s) => s.rateOverrides);
  const customCfg = useAllocationStore((s) => s.custom);
  const activeProfile = useAllocationStore((s) => s.activeProfile);
  const timelines = useAllocationStore((s) => s.timelines);

  const setAmount = useAllocationStore((s) => s.setAmount);
  const setRateOverride = useAllocationStore((s) => s.setRateOverride);
  const setCustom = useAllocationStore((s) => s.setCustom);
  const setActiveProfile = useAllocationStore((s) => s.setActiveProfile);
  const setTimeline = useAllocationStore((s) => s.setTimeline);
  const snapTo = useAllocationStore((s) => s.snapTo);

  const total = useMemo(
    () => Object.values(amounts).reduce((a, v) => a + v, 0) + customCfg.amount,
    [amounts, customCfg.amount],
  );

  useEffect(() => {
    const nothingAllocated =
      Object.values(amounts).every((v) => v === 0) && customCfg.amount === 0;
    if (nothingAllocated && capitalToAllocate > 0) {
      const suggested = computeSuggestion(
        situation,
        activeProfile,
        capitalToAllocate,
      );
      snapTo(suggested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situation, capitalToAllocate]);

  function handleProfileSelect(profile: ProfileId) {
    setActiveProfile(profile);
    const suggested = computeSuggestion(situation, profile, capitalToAllocate);
    snapTo(suggested);
  }

  return (
    <>
      <TopBar
        title={t('allocation.title')}
        subtitle={t('allocation.subtitle')}
        onMenuClick={onMenuClick}
        rightSlot={
          <div className="hidden text-right sm:block">
            <p className="text-xs text-muted-foreground">
              {t('allocation.capital.to_allocate')}
            </p>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(capitalToAllocate, language)}
            </p>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <ProfileSelector
            active={activeProfile}
            onSelect={handleProfileSelect}
          />

          <Card className="overflow-hidden p-0">
            <CardContent className="p-0">
              {PRODUCT_DISPLAY_ORDER.filter((id) => id !== 'custom').map(
                (productId) => {
                  const id = productId as StandardProductId;
                  const product = PRODUCTS[id];
                  const defaultRate = getDefaultRate(product);
                  const overrideRate = rateOverrides[id];
                  const effectiveRate = overrideRate ?? defaultRate;
                  const sliderMax = product.cap ?? capitalToAllocate * 2;
                  const timeline = timelines[id] ?? DEFAULT_TIMELINE;
                  return (
                    <ProductSlider
                      key={id}
                      product={product}
                      amount={amounts[id] ?? 0}
                      effectiveRate={effectiveRate}
                      isRateOverridden={overrideRate !== undefined}
                      sliderMax={sliderMax}
                      timeline={timeline}
                      onAmountChange={(n) => setAmount(id, n)}
                      onRateChange={(r) => setRateOverride(id, r)}
                      onRateReset={() => setRateOverride(id, null)}
                      onTimelineChange={(tl) => setTimeline(id, tl)}
                    />
                  );
                },
              )}

              <CustomProductSlider
                custom={customCfg}
                sliderMax={capitalToAllocate * 2}
                timeline={timelines['custom'] ?? DEFAULT_TIMELINE}
                onChange={setCustom}
                onTimelineChange={(tl) => setTimeline('custom', tl)}
              />
            </CardContent>
          </Card>

          <AllocationTotalCard
            totalAllocated={total}
            capitalToAllocate={capitalToAllocate}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Link to="/inputs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              {t('allocation.actions.back')}
            </Button>
          </Link>
          <Link to="/simulation">
            <Button>
              {t('allocation.actions.continue')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
