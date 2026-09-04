/**
 * Route-aware banner eligibility — durable policy lives in
 * `docs/design/landscape/ad-placement-policy.md`.
 *
 * Pure functions so unit tests and UI share one decision table.
 */

/** Hub / parent surfaces that may reserve a bottom banner strip. */
export const BANNER_ELIGIBLE_EXACT_PATHS = [
  '/',
  '/games',
  '/practice',
  '/rewards',
  '/parent',
] as const;

export type BannerEligiblePath = (typeof BANNER_ELIGIBLE_EXACT_PATHS)[number];

export type BannerIneligibilityReason =
  | 'opening_sequence'
  | 'active_gameplay'
  | 'active_practice'
  | 'category_detail'
  | 'cards_detail'
  | 'developer_surface'
  | 'no_compliant_placement';

/** App-open / interstitial advertising is not part of the shipping surface. */
export const APP_OPEN_ADS_ENABLED = false;

const ELIGIBLE = new Set<string>(BANNER_ELIGIBLE_EXACT_PATHS);

/**
 * Normalize an Expo Router pathname for eligibility checks.
 * Strips query strings and a trailing slash (except root).
 * Empty / null → `''` (ineligible until a real path is known).
 */
export function normalizeAdPathname(pathname: string | null | undefined): string {
  if (!pathname || pathname.length === 0) return '';
  const bare = pathname.split('?')[0] ?? '';
  if (bare.length > 1 && bare.endsWith('/')) return bare.replace(/\/+$/, '') || '/';
  return bare || '';
}

/** True when a bottom adaptive banner may mount beneath the Stack. */
export function isBannerAdEligible(pathname: string | null | undefined): boolean {
  const path = normalizeAdPathname(pathname);
  return path.length > 0 && ELIGIBLE.has(path);
}

/** Why a pathname is suppressed, or `null` when eligible. */
export function bannerAdIneligibilityReason(
  pathname: string | null | undefined,
): BannerIneligibilityReason | null {
  if (isBannerAdEligible(pathname)) return null;
  const path = normalizeAdPathname(pathname);
  if (!path) return 'no_compliant_placement';
  if (path === '/intro' || path.startsWith('/intro/')) return 'opening_sequence';
  if (path.startsWith('/game/')) return 'active_gameplay';
  if (path.startsWith('/practice/')) return 'active_practice';
  if (path.startsWith('/category/')) return 'category_detail';
  if (path.startsWith('/cards/')) return 'cards_detail';
  if (path === '/dev' || path.startsWith('/dev/')) return 'developer_surface';
  return 'no_compliant_placement';
}
