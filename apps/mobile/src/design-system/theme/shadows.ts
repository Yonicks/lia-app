/**
 * index.html 57-63 — the four-step CSS box-shadow scale. There is no
 * lossless mapping from a CSS box-shadow string to React Native's
 * `shadow*`/`elevation` props (RN shadows are a single offset + blur + one
 * colour, not an arbitrary comma list; Android ignores `shadow*` entirely
 * and only understands `elevation`). Each step below is tuned to reproduce
 * the *perceived* weight of its CSS source — see phase-05-report.md for the
 * chosen values and the reasoning per step — never the literal numbers.
 * `shadow*` and `elevation` are simply both set on every step; iOS reads the
 * former and ignores `elevation`, Android does the reverse, so one plain
 * object serves both platforms without a `Platform.select` — which also
 * keeps this module free of a `react-native` import, so Tier 1 (vitest) can
 * import the whole theme without pulling in RN's Flow-syntax source (RN has
 * no CommonJS/ESM build vitest's esbuild/rolldown pipeline can parse).
 *
 * Deliberate deviation from phase-05-plan.md: shadow colour is the same
 * ink/brown family the CSS uses (`rgba(73,46,25,*)` etc, not pure black),
 * because Talki's shadows are consistently warm-toned, not neutral.
 */
export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

function shadow(
  color: string,
  offset: { width: number; height: number },
  opacity: number,
  radius: number,
  elevation: number
): ShadowStyle {
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

/** CSS: `0 2px 6px rgba(65,39,26,.06)`. Lightest step — a barely-there card
 *  lift, e.g. a pill or a resting button. */
export const shadowSm = shadow('#41271A', { width: 0, height: 2 }, 0.06, 6, 2);

/** CSS: `0 6px 16px rgba(73,46,25,.09)`. The default resting card shadow —
 *  the workhorse used by cat-card/game-card in legacy. */
export const shadowCard = shadow('#492E19', { width: 0, height: 4 }, 0.09, 10, 4);

/** CSS: `0 10px 28px rgba(73,46,25,.13)`. A raised/floating element — reward
 *  overlays, toasts, anything overlaying page content. */
export const shadowFloating = shadow('#492E19', { width: 0, height: 6 }, 0.13, 16, 8);

/** CSS: `0 6px 18px -6px rgba(109,59,96,.10), 0 2px 8px -2px rgba(160,120,90,.08)`.
 *  Two soft, negative-spread layers in CSS approximate a diffuse sticky-header
 *  lift; RN has one shadow layer, so the two are merged into a single wider,
 *  softer spread that reads the same at a glance without doubling native
 *  view cost. Used only by TopBar. */
export const shadowTopbar = shadow('#6D3B60', { width: 0, height: 3 }, 0.1, 12, 4);

/** index.html 108-112 — the four-step scale, in one place for
 *  `theme.shadows.<step>`. */
export const shadows = {
  sm: shadowSm,
  card: shadowCard,
  floating: shadowFloating,
  topbar: shadowTopbar,
} as const;
