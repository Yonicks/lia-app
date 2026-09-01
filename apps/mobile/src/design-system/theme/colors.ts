/**
 * Every colour token from index.html 29-65, transcribed exactly — same hex,
 * same name minus the `--` and kebab-case-to-camelCase rename. See
 * docs/migration/phases/phase-05-plan.md "Port the tokens, not the CSS".
 *
 * Two palettes coexist on purpose: V2 (`v2`) still drives every game screen,
 * V3 (`v3`) drives the redesigned Home. Collapsing them is a design decision,
 * not a migration decision — see the plan's "Two palettes coexist" section.
 */

/** index.html 30-40 — the original Talki V2 palette plus the legacy handful
 *  of bare names (`cream`, `paper`, `ink`, ...) that predate the V2/V3 split
 *  but are still referenced directly by components today. */
export const v2 = {
  cream: '#FFF8EA',
  paper: '#FFFFFF',
  ink: '#3A2A52',
  inkSoft: '#7B6E8C',
  berry: '#FF8FA8',
  berryDark: '#E85E85',
  sun: '#FFD75A',
  sunDark: '#E8B93A',
  leaf: '#8FD3C1',
  leafDark: '#4FA893',
  sky: '#6FA3DE',
  skyDark: '#3D78B5',
  grape: '#7C4CD6',
  grapeDark: '#6D3BA6',
  clay: '#FFCDA1',
  clayDark: '#F0A868',
  teal: '#6FC2B4',
  tealDark: '#3D8F82',
  wood: '#8B5FC9',
  woodDark: '#6D3BA6',
  line: '#F1E4CE',
  purple: '#6D3BA6',
  purpleBright: '#7C4CD6',
  mint: '#8FD3C1',
  peach: '#FFCDA1',
  gold: '#FFD75A',
  pink: '#FFD9E6',
  pinkDark: '#F2A8C4',
} as const;

/** index.html 43-55 — the newer Talki V3 palette that drives Home. */
export const v3 = {
  purple900: '#44206F',
  purple800: '#542780',
  purple700: '#6D3BA6',
  purple600: '#7C4CD6',
  purple500: '#9366E5',
  purple200: '#DED0FA',
  purple100: '#EEE6FF',
  purple050: '#F7F2FF',
  mint500: '#8FD3C1',
  mint200: '#CFEDE5',
  mint100: '#EAF8F4',
  pink500: '#F46B91',
  pink300: '#FFA8C2',
  pink200: '#FFD9E6',
  pink100: '#FFF0F5',
  peach500: '#FFB977',
  peach300: '#FFCDA1',
  peach100: '#FFF1E2',
  gold500: '#FFD75A',
  gold300: '#FFE796',
  gold100: '#FFF8DC',
  blue500: '#69B7EF',
  blue200: '#CFEAFB',
  blue100: '#EEF8FF',
  green500: '#79CFAE',
  green100: '#EAF8F1',
  bg: '#FFF9EF',
  surface: '#FFFFFF',
  surfaceSoft: '#FFFCF8',
  textPrimary: '#241735',
  textHeading: '#4E2A72',
  textSecondary: '#746887',
  textMuted: '#9B91A7',
  borderSoft: '#F1E7D7',
  track: '#F3EEE6',
} as const;

/**
 * The category-to-colour mapping. Each legacy category carries a `cls`
 * (e.g. `c-animals`) whose only React Native meaning is as a lookup key here
 * (see phase-02-plan.md "cls has no React Native meaning" and
 * domain/types.ts). Gradient stops transcribed from `.c-<id> .hero-chip` in
 * index.html 156-166; `body`/`outside` use one-off hex pairs that never got
 * named CSS variables in the legacy stylesheet, so they are inlined here
 * exactly as they appear there.
 */
export const categoryColors = {
  animals: { from: v2.leaf, to: v2.leafDark },
  food: { from: v2.berry, to: v2.berryDark },
  colors: { from: v2.grape, to: v2.grapeDark },
  home: { from: v2.sky, to: v2.skyDark },
  family: { from: v2.clay, to: v2.clayDark },
  body: { from: '#D8567F', to: '#A83560' },
  actions: { from: v2.teal, to: v2.tealDark },
  numbers: { from: v2.sun, to: v2.sunDark },
  outside: { from: '#4FA3D1', to: '#2E6E96' },
  emotions: { from: v2.wood, to: v2.woodDark },
  mine: { from: v2.grape, to: v2.grapeDark },
} as const;

export const colors = { v2, v3, category: categoryColors } as const;
