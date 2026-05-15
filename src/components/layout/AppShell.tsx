import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SiteFooter } from './SiteFooter';

/**
 * Outer shell used by every page (except possibly the home page).
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │ Sidebar │ <Outlet /> (page content)  │
 *   │         │                            │
 *   └──────────────────────────────────────┘
 *
 * Each page provides its own TopBar via the page component itself, so titles
 * and right-side widgets vary by route.
 */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // We always render the sidebar twice for clarity:
  // - The desktop one is sticky and part of the flex layout (hidden on mobile)
  // - The mobile one is the slide-in (hidden on desktop)
  // Same component handles both via the `isMobile` prop.
  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only fixed left-3 top-3 z-50 rounded-md bg-card px-3 py-2 text-sm font-medium text-foreground shadow focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {t('common.skip_to_content')}
      </a>

      {/* Desktop sidebar — part of the layout */}
      <Sidebar isMobile={false} open={false} onClose={() => undefined} />

      {/* Mobile sidebar — overlay */}
      <Sidebar
        isMobile={true}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className="min-w-0 flex-1">
          <Outlet context={{ onMenuClick: () => setMobileOpen(true) }} />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
