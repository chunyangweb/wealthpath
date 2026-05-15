import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarProps = {
  /** When true, sidebar is fixed-position over the page on mobile. */
  isMobile: boolean;
  /** Whether the mobile sidebar is currently shown. */
  open: boolean;
  /** Called when user dismisses the mobile sidebar (overlay click, close button). */
  onClose: () => void;
};

/**
 * The persistent left navigation.
 *
 * Desktop: always visible, 15rem wide, part of the flex layout.
 * Mobile: hidden by default; slides in as an overlay when `open` is true.
 *
 * Per user feedback: icon-only logo (no "Wealthpath" text), text-only nav items
 * (no leading icons). Disclaimer pinned to the bottom.
 */
export function Sidebar({ isMobile, open, onClose }: SidebarProps) {
  const { t } = useTranslation();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'block rounded-md px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-secondary font-medium text-secondary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card/60 backdrop-blur',
          // Desktop: always docked
          !isMobile && 'hidden md:sticky md:top-0 md:flex md:h-screen md:w-60',
          // Mobile: slide-in panel, never part of the desktop layout
          isMobile &&
            'fixed left-0 top-0 z-40 h-full w-64 transition-transform md:hidden',
          isMobile && (open ? 'translate-x-0' : '-translate-x-full'),
        )}
        aria-label="Main navigation"
      >
        {/* Logo area — icon only, per user request */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" aria-label="Home" onClick={isMobile ? onClose : undefined}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" aria-hidden />
            </div>
          </Link>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3" aria-label="Sections">
          <NavLink to="/inputs" className={linkClass} onClick={isMobile ? onClose : undefined}>
            {t('nav.inputs')}
          </NavLink>
          <NavLink
            to="/allocation"
            className={linkClass}
            onClick={isMobile ? onClose : undefined}
          >
            {t('nav.allocation')}
          </NavLink>
          <NavLink
            to="/simulation"
            className={linkClass}
            onClick={isMobile ? onClose : undefined}
          >
            {t('nav.simulation')}
          </NavLink>
          <NavLink
            to="/summary"
            className={linkClass}
            onClick={isMobile ? onClose : undefined}
          >
            {t('nav.summary')}
          </NavLink>
        </nav>

        {/* Disclaimer pinned at the bottom of the sidebar */}
        <div className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground2">
          {t('footer.disclaimer')}
        </div>
      </aside>
    </>
  );
}
