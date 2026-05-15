import { useOutletContext } from 'react-router-dom';

/**
 * Pages call this to get the `onMenuClick` callback that opens the mobile sidebar.
 * Keeps the AppShell as the single owner of the mobile menu state.
 */
export type ShellContext = {
  onMenuClick: () => void;
};

export function useShellContext(): ShellContext {
  return useOutletContext<ShellContext>();
}
