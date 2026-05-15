import { useEffect, useState } from 'react';
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
        <Outlet context={{ onMenuClick: () => setMobileOpen(true) }} />
        <SiteFooter />
      </div>
    </div>
  );
}
