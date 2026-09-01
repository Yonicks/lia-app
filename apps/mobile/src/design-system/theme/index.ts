import { colors } from './colors';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export { colors, radii, shadows, spacing, typography };
export { categoryColors, v2, v3 } from './colors';
export { fontAssets } from './fonts';
export { fontFamily } from './typography';
export {
  homePaddingInline,
  homeGridGap,
  homeSectionGap,
  barHeight,
  adHeight,
  tbSideClear,
} from './spacing';
export { shadowSm, shadowCard, shadowFloating, shadowTopbar } from './shadows';

/** The single theme object, snapshot-tested in theme.test.ts so any
 *  accidental drift shows up as a review diff. */
export const theme = {
  colors,
  radii,
  spacing,
  shadows,
  typography,
} as const;
