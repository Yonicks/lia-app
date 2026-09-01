import { useEffect } from 'react';

/**
 * The master migration plan's Phase 6 calls for "the approved separate
 * Yonicks Studios logo assets in the repository" as an optional prefix
 * before the Talki opening sequence. Those assets do not exist: the only
 * occurrence of "yonicks" anywhere in the repository outside the Android
 * package path is a privacy-policy URL (index.html 3288), and
 * `assets/v2/brand/` holds six files, all Talki branding, none of them a
 * studio bumper.
 *
 * This is a product decision, not an engineering one — see "Findings and
 * drift" in docs/migration/phase-06-report.md for what would be needed to
 * build it. Per the phase's standing rules, no placeholder wordmark and no
 * system-font stand-in are acceptable substitutes, so `STUDIO_BUMPER_ASSETS`
 * stays empty and this component renders nothing and completes
 * immediately — an optional prefix that is cleanly skipped, exactly as
 * `phase-06-plan.md` "Deliberate deviations" specifies. Dropping real
 * assets in later only means populating this one object; every consumer
 * (today, none — `IntroSequence` is the whole sequence) is unaffected.
 */
const STUDIO_BUMPER_ASSETS: Record<string, never> = {};

export interface StudioBumperProps {
  onComplete: () => void;
}

export function StudioBumper({ onComplete }: StudioBumperProps) {
  const hasAssets = Object.keys(STUDIO_BUMPER_ASSETS).length > 0;

  useEffect(() => {
    if (!hasAssets) onComplete();
    // hasAssets is a module-level constant (always false today); this
    // effect intentionally runs once on mount, matching "skipped cleanly
    // when assets are absent".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasAssets) return null;

  // Unreachable today — no branch of STUDIO_BUMPER_ASSETS is ever populated
  // yet, kept here only as the shape a future bumper would fill in.
  return null;
}
