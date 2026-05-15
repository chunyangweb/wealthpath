import { Menu } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';

type TopBarProps = {
  /** The page title shown on the left side. */
  title?: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  /** Optional right-side widget (e.g. "capital to allocate" card on Allocation page). */
  rightSlot?: React.ReactNode;
  /** Called when user taps the hamburger on mobile. */
  onMenuClick: () => void;
};

/**
 * Top bar of the main content area. Holds:
 * - Mobile-only hamburger to open the sidebar
 * - Page title (left)
 * - Language toggle and GitHub link (right) — language toggle moved here per user feedback
 */
export function TopBar({ title, subtitle, rightSlot, onMenuClick }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-background/40 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          {title && (
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {rightSlot}
        <LanguageToggle />
      </div>
    </div>
  );
}
