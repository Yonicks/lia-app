/**
 * The single, centralised route-to-orientation map. No game or screen may
 * call `expo-screen-orientation`'s `lockAsync` itself — every route asks
 * this module what it should be, and `OrientationService.applyFor(route)`
 * is the only caller of `lockAsync` in the whole app (see
 * phase-04-plan.md, "Orientation is centralised policy, not scattered
 * calls").
 *
 * DELIBERATE DEVIATION FROM PARITY: legacy hard-locks portrait for the
 * entire app (index.html 4088-4090, `lockPortrait()`, and the `orientation`
 * key in manifest.json). This is recorded in
 * docs/migration/feature-parity-checklist.md section 14 and must not be
 * "restored" — games and practice are deliberately landscape here.
 */

/** The five route categories this phase's policy distinguishes. Phase 5+
 *  screens map their actual route to one of these when they call
 *  `orientationService.applyFor(...)`. */
export type RouteKind = 'intro' | 'home' | 'category' | 'games' | 'practice';

export type OrientationPolicyValue = 'responsive' | 'landscape';

export const orientationPolicy: Record<RouteKind, OrientationPolicyValue> = {
  intro: 'responsive',
  home: 'responsive',
  category: 'responsive',
  games: 'landscape',
  practice: 'landscape',
};

/**
 * Pure lookup. An unknown route falls back to 'responsive' rather than
 * throwing — per phase-04-plan.md's own default for this exact question
 * ("An unknown route falls back to responsive rather than throwing").
 */
export function policyFor(route: string): OrientationPolicyValue {
  return (orientationPolicy as Record<string, OrientationPolicyValue>)[route] || 'responsive';
}
