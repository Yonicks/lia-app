/**
 * The exact eight weights required by phase-05-plan.md ("Bundle the
 * fonts"): Assistant 400/600/700/800, Rubik 500/700/800/900. Files are
 * real .ttf's copied into apps/mobile/assets/fonts/ from the
 * @expo-google-fonts/assistant@0.4.1 and @expo-google-fonts/rubik@0.4.2 npm
 * packages (MIT AND OFL-1.1 — the font files themselves are SIL Open Font
 * License 1.1; see phase-05-report.md "Font licensing"). Loading them as
 * local assets rather than depending on those packages at runtime keeps the
 * app's only font dependency a handful of committed files, with no network
 * fetch possible even accidentally.
 */
export const fontAssets = {
  Assistant_400Regular: require('../../../assets/fonts/Assistant_400Regular.ttf'),
  Assistant_600SemiBold: require('../../../assets/fonts/Assistant_600SemiBold.ttf'),
  Assistant_700Bold: require('../../../assets/fonts/Assistant_700Bold.ttf'),
  Assistant_800ExtraBold: require('../../../assets/fonts/Assistant_800ExtraBold.ttf'),
  Rubik_500Medium: require('../../../assets/fonts/Rubik_500Medium.ttf'),
  Rubik_700Bold: require('../../../assets/fonts/Rubik_700Bold.ttf'),
  Rubik_800ExtraBold: require('../../../assets/fonts/Rubik_800ExtraBold.ttf'),
  Rubik_900Black: require('../../../assets/fonts/Rubik_900Black.ttf'),
} as const;
