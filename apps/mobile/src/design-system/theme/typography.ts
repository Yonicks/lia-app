/**
 * index.html 26, 78, 85 — Assistant for body text, Rubik for headings and
 * display text. Bundled locally via expo-font (see
 * design-system/theme/fonts.ts), never fetched from the Google Fonts CDN
 * legacy uses. Family name strings below MUST match the keys passed to
 * `useFonts()` in fonts.ts exactly, or RN silently falls back to a system
 * face instead of erroring.
 */
export const fontFamily = {
  body: {
    regular: 'Assistant_400Regular',
    semibold: 'Assistant_600SemiBold',
    bold: 'Assistant_700Bold',
    extrabold: 'Assistant_800ExtraBold',
  },
  heading: {
    medium: 'Rubik_500Medium',
    bold: 'Rubik_700Bold',
    extrabold: 'Rubik_800ExtraBold',
    black: 'Rubik_900Black',
  },
} as const;

export const typography = { fontFamily } as const;
