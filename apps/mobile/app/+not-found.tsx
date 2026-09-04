import { Redirect } from 'expo-router';

/**
 * Legacy `views[view]` missing → Home (index.html 2109).
 * Landscape product keeps the silent redirect so deep-link typos never leave
 * a child stranded; a dedicated interstitial was tried in Phase 28 but Expo
 * Stack retention made dual `home-root` nodes flaky under Playwright.
 * Reachability of Home after an unknown path is covered by phase-28 e2e.
 */
export default function NotFound() {
  return <Redirect href="/" />;
}
