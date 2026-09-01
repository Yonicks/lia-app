import type { ImageSourcePropType } from 'react-native';

import { introAssets } from '@/design-system/assets';

import type { IntroLayerId } from './timeline';

/**
 * Which real asset(s) back each `IntroLayerId` — the "asset entry" Tier 1
 * checks every timeline layer against (phase-06-plan.md work item 7).
 * `secondary` is legacy's `.intro-tag` (index.html 1337): a short line of
 * text, not an image, so it is a `text` entry rather than an `image` one.
 */
export type IntroLayerAsset =
  | { kind: 'image'; sources: readonly ImageSourcePropType[] }
  | { kind: 'text'; text: string };

export const INTRO_LAYER_ASSETS: Record<IntroLayerId, IntroLayerAsset> = {
  background: { kind: 'image', sources: [introAssets.background] },
  star: { kind: 'image', sources: [introAssets.star] },
  sparkles: {
    kind: 'image',
    sources: [introAssets.sparkleYellow, introAssets.sparklePurple, introAssets.sparkleGreen, introAssets.sparkleSmall],
  },
  wordmark: { kind: 'image', sources: [introAssets.wordmark] },
  secondary: { kind: 'text', text: 'לומדים, מתרגלים ומדברים' },
};

/** Flat list of every image source the sequence needs decoded before the
 *  first frame — read by `useIntroPreload.ts`. */
export const INTRO_IMAGE_SOURCES: readonly ImageSourcePropType[] = Object.values(INTRO_LAYER_ASSETS).flatMap((asset) =>
  asset.kind === 'image' ? asset.sources : []
);

/**
 * Deterministic sparkle burst layout — a fixed ring of points around the
 * star, computed once from the index, never `Math.random()`. The FORBIDDEN
 * list in the phase prompt is explicit: "No randomness ... in the
 * sequence" — legacy's own `spawnIntroSparks` (index.html 4181-4198) does
 * use `Math.random()` for its 4.4s CSS-driven burst, but that is exactly
 * the kind of decode-order/timing dependence this deterministic
 * replacement timeline forbids.
 */
export interface SparklePoint {
  angleDeg: number;
  distance: number;
  source: ImageSourcePropType;
}

const SPARKLE_COUNT = 8;

export const INTRO_SPARKLE_POINTS: readonly SparklePoint[] = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const sources = INTRO_LAYER_ASSETS.sparkles.kind === 'image' ? INTRO_LAYER_ASSETS.sparkles.sources : [];
  return {
    angleDeg: (360 / SPARKLE_COUNT) * i,
    distance: i % 2 === 0 ? 1 : 0.72,
    source: sources[i % sources.length],
  };
});
