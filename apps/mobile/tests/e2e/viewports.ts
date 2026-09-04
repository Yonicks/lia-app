/**
 * The landscape viewport matrix, shared between playwright.config.ts (which
 * needs it to declare projects) and _helpers.ts (which needs it for
 * captureMatrix).
 *
 * Phase 17 (docs/migration/phase-17-report.md) replaced the historical
 * ten-viewport matrix — six portrait entries plus four landscape ones,
 * inherited from `tests/interaction_suite.py`'s legacy `DEVICES` — with the
 * eight-viewport, all-landscape matrix frozen by
 * docs/migration/phase-16-audit.md §8 and specified verbatim by
 * phase-17-plan.md "Required viewport matrix". The child (and now parent)
 * product is landscape-only; a matrix that is mostly portrait viewports no
 * longer represents the shipping product.
 *
 * `landscape-844`, `landscape-932`, `tablet-4-3`, and `tablet-16-10` keep
 * their prior names — those four dimensions were already present in the old
 * matrix and are unchanged here, so their existing committed screenshots
 * stay meaningfully comparable. The other four are net-new for Phase 17.
 */
export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export const VIEWPORTS: Viewport[] = [
  { name: 'compact-phone', width: 667, height: 375 },
  { name: 'compact-android-phone', width: 740, height: 360 },
  { name: 'landscape-844', width: 844, height: 390 },
  { name: 'landscape-932', width: 932, height: 430 },
  { name: 'tablet-4-3', width: 1024, height: 768 },
  { name: 'tablet-1133', width: 1133, height: 744 },
  { name: 'tablet-16-10', width: 1280, height: 800 },
  { name: 'large-tablet', width: 1366, height: 1024 },
];

export const MIN_TOUCH = 48;
