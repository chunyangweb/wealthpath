import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ProfileId } from '@/lib/finance/suggestion';

type Props = {
  active: ProfileId;
  onSelect: (profile: ProfileId) => void;
};

/**
 * Three-button profile selector at the top of the allocation column.
 * Clicking a button snaps the sliders to the corresponding template.
 */
export function ProfileSelector({ active, onSelect }: Props) {
  const { t } = useTranslation();
  const profiles: { id: ProfileId; label: string }[] = [
    { id: 'prudent', label: t('allocation.profile.prudent') },
    { id: 'balanced', label: t('allocation.profile.balanced') },
    { id: 'dynamic', label: t('allocation.profile.dynamic') },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">
          {t('allocation.profile.label')}
        </span>
        <span className="text-xs text-muted-foreground2">
          {t('allocation.profile.help')}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              'rounded-md px-2 py-1.5 text-xs transition-colors',
              active === p.id
                ? 'bg-primary font-medium text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-pressed={active === p.id}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
