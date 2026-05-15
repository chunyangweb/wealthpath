import { useSettingsStore } from '@/state/settingsStore';
import { cn } from '@/lib/utils';

/**
 * Top-right FR/EN switch. Two pills, current one highlighted.
 * Persists via settings store → localStorage automatically.
 */
export function LanguageToggle() {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5 text-xs">
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={cn(
          'rounded-sm px-2.5 py-1 transition-colors',
          language === 'fr'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-pressed={language === 'fr'}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          'rounded-sm px-2.5 py-1 transition-colors',
          language === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
    </div>
  );
}
