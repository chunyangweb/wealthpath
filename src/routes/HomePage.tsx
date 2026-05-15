import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BarChart3, Droplets, Lock } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { useShellContext } from '@/components/layout/useShellContext';
import { Button } from '@/components/ui/Button';

/**
 * Landing page. Uses the same shell as every other page so the visual language is
 * consistent. Hero + three feature cards explaining the v1 value props.
 */
export function HomePage() {
  const { t } = useTranslation();
  const { onMenuClick } = useShellContext();

  return (
    <>
      <TopBar onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <p className="mb-3 text-sm font-medium text-primary">
            {t('app.tagline')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t('home.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('home.subtitle')}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/inputs">
              <Button size="lg">
                {t('home.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              {t('home.privacy')}
            </p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-3">
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            title={t('home.features.projection.title')}
            body={t('home.features.projection.body')}
          />
          <FeatureCard
            icon={<Droplets className="h-5 w-5 text-primary" />}
            title={t('home.features.liquidity.title')}
            body={t('home.features.liquidity.body')}
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5 text-primary" />}
            title={t('home.features.private.title')}
            body={t('home.features.private.body')}
          />
        </div>
      </div>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="mb-1.5 font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
