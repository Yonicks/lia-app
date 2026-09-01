import { describe, expect, it } from 'vitest';

import { theme } from '@/design-system/theme';
import { categoryColors, v2, v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { fontFamily } from '@/design-system/theme/typography';
import type { CategoryId } from '@/domain/types';

/**
 * index.html 29-65, transcribed verbatim into theme/colors.ts — every hex
 * below is copy-pasted from the plan's ground-truth block, not re-derived,
 * so a typo in either place would show up as a mismatch here.
 */
const EXPECTED_V2: Record<string, string> = {
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
};

const EXPECTED_V3: Record<string, string> = {
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
};

const ALL_CATEGORY_IDS: CategoryId[] = [
  'animals', 'food', 'colors', 'home', 'family', 'body', 'actions', 'numbers', 'outside', 'emotions', 'mine',
];

describe('theme/colors — V2 palette', () => {
  it.each(Object.entries(EXPECTED_V2))('token %s is exactly %s', (name, hex) => {
    expect(v2[name as keyof typeof v2]).toBe(hex);
  });

  it('has no undefined token', () => {
    for (const value of Object.values(v2)) {
      expect(value).toBeDefined();
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('theme/colors — V3 palette', () => {
  it.each(Object.entries(EXPECTED_V3))('token %s is exactly %s', (name, hex) => {
    expect(v3[name as keyof typeof v3]).toBe(hex);
  });

  it('has no undefined token', () => {
    for (const value of Object.values(v3)) {
      expect(value).toBeDefined();
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('theme/colors — both palettes coexist', () => {
  it('V2 and V3 are distinct, both-present namespaces', () => {
    expect(Object.keys(v2).length).toBeGreaterThan(20);
    expect(Object.keys(v3).length).toBeGreaterThan(20);
    // Overlap is expected (both legacy palettes share the grape/purple family
    // by design — see phase-05-plan.md), but neither collapses into the other.
    expect(v2).not.toEqual(v3);
  });
});

describe('theme/categoryTheme — cls-to-colour mapping', () => {
  it('has an entry for every CategoryId, including mine', () => {
    for (const id of ALL_CATEGORY_IDS) {
      expect(categoryColors[id]).toBeDefined();
      expect(categoryColors[id].from).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(categoryColors[id].to).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('transcribes the exact gradient stops from index.html 156-166', () => {
    expect(categoryColors.animals).toEqual({ from: '#8FD3C1', to: '#4FA893' });
    expect(categoryColors.food).toEqual({ from: '#FF8FA8', to: '#E85E85' });
    expect(categoryColors.colors).toEqual({ from: '#7C4CD6', to: '#6D3BA6' });
    expect(categoryColors.home).toEqual({ from: '#6FA3DE', to: '#3D78B5' });
    expect(categoryColors.family).toEqual({ from: '#FFCDA1', to: '#F0A868' });
    expect(categoryColors.body).toEqual({ from: '#D8567F', to: '#A83560' });
    expect(categoryColors.actions).toEqual({ from: '#6FC2B4', to: '#3D8F82' });
    expect(categoryColors.numbers).toEqual({ from: '#FFD75A', to: '#E8B93A' });
    expect(categoryColors.outside).toEqual({ from: '#4FA3D1', to: '#2E6E96' });
    expect(categoryColors.emotions).toEqual({ from: '#8B5FC9', to: '#6D3BA6' });
    expect(categoryColors.mine).toEqual({ from: '#7C4CD6', to: '#6D3BA6' });
  });
});

describe('theme/radii — index.html 40', () => {
  it('preserves 18 / 16 / 24 exactly', () => {
    expect(radii).toEqual({ card: 18, btn: 16, hero: 24 });
  });
});

describe('theme/typography — font family names', () => {
  it('has all four Assistant weights (400/600/700/800)', () => {
    expect(fontFamily.body).toEqual({
      regular: 'Assistant_400Regular',
      semibold: 'Assistant_600SemiBold',
      bold: 'Assistant_700Bold',
      extrabold: 'Assistant_800ExtraBold',
    });
  });

  it('has all four Rubik weights (500/700/800/900)', () => {
    expect(fontFamily.heading).toEqual({
      medium: 'Rubik_500Medium',
      bold: 'Rubik_700Bold',
      extrabold: 'Rubik_800ExtraBold',
      black: 'Rubik_900Black',
    });
  });
});

describe('theme — whole-object snapshot', () => {
  it('matches the committed snapshot (any drift must show up in review)', () => {
    expect(theme).toMatchSnapshot();
  });
});
