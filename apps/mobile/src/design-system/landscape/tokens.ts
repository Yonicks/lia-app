/**
 * Landscape spacing/size tokens — Phase 18.
 *
 * Driven only by Phase 17's DeviceClass / uiScale. Feature screens must not
 * invent local breakpoints; they consume these helpers (or
 * useLandscapeLayout() directly).
 *
 * Compact phones reduce gaps/padding/title/card sizes before dropping content.
 * Tablets gain gutters and max card sizes rather than uniformly scaling the
 * phone UI to giant proportions.
 */
import type { DeviceClass } from '../responsive/breakpoints';

export type LandscapeShellVariant = 'home' | 'games' | 'practice' | 'detail';

const GAP: Record<DeviceClass, number> = {
  compactPhone: 8,
  phone: 10,
  tablet: 14,
  largeTablet: 16,
};

const PAD_INLINE: Record<DeviceClass, number> = {
  compactPhone: 10,
  phone: 14,
  tablet: 20,
  largeTablet: 28,
};

const PAD_BLOCK: Record<DeviceClass, number> = {
  compactPhone: 6,
  phone: 8,
  tablet: 12,
  largeTablet: 14,
};

const TITLE_SIZE: Record<DeviceClass, number> = {
  compactPhone: 22,
  phone: 26,
  tablet: 32,
  largeTablet: 36,
};

const SUBTITLE_SIZE: Record<DeviceClass, number> = {
  compactPhone: 12,
  phone: 13,
  tablet: 15,
  largeTablet: 16,
};

/** Activity card (games/practice) — width is grid-driven; these cap height. */
const ACTIVITY_CARD_MAX_H: Record<DeviceClass, number> = {
  compactPhone: 118,
  phone: 132,
  tablet: 168,
  largeTablet: 190,
};

const CATEGORY_CARD_W: Record<DeviceClass, number> = {
  compactPhone: 72,
  phone: 84,
  tablet: 104,
  largeTablet: 116,
};

const CATEGORY_CARD_H: Record<DeviceClass, number> = {
  compactPhone: 88,
  phone: 100,
  tablet: 120,
  largeTablet: 132,
};

const SIDE_NAV_SIZE: Record<DeviceClass, number> = {
  compactPhone: 52,
  phone: 56,
  tablet: 64,
  largeTablet: 68,
};

const TOP_BAR_MIN_H: Record<DeviceClass, number> = {
  compactPhone: 52,
  phone: 56,
  tablet: 60,
  largeTablet: 64,
};

const HERO_MAX_W: Record<DeviceClass, number> = {
  compactPhone: 280,
  phone: 320,
  tablet: 380,
  largeTablet: 420,
};

const PAGE_DOT: Record<DeviceClass, number> = {
  compactPhone: 8,
  phone: 9,
  tablet: 10,
  largeTablet: 11,
};

/**
 * Vocabulary word-grid density (Phase 23). Landscape height is scarce —
 * prefer fewer, larger tiles + paging over a long vertical portrait grid.
 * Columns grow on tablets; rows stay 2 so tiles remain readable.
 */
const WORD_GRID_COLS: Record<DeviceClass, number> = {
  compactPhone: 5,
  phone: 6,
  tablet: 7,
  largeTablet: 8,
};

const WORD_GRID_ROWS: Record<DeviceClass, number> = {
  compactPhone: 2,
  phone: 2,
  tablet: 2,
  largeTablet: 2,
};

const WORD_ART: Record<DeviceClass, number> = {
  compactPhone: 40,
  phone: 48,
  tablet: 56,
  largeTablet: 64,
};

const WORD_LABEL: Record<DeviceClass, number> = {
  compactPhone: 13,
  phone: 14,
  tablet: 16,
  largeTablet: 17,
};

export interface LandscapeTokens {
  gap: number;
  padInline: number;
  padBlock: number;
  titleSize: number;
  subtitleSize: number;
  activityCardMaxHeight: number;
  categoryCardWidth: number;
  categoryCardHeight: number;
  sideNavSize: number;
  topBarMinHeight: number;
  heroMaxWidth: number;
  pageDotSize: number;
  /** Reserved width for each side-nav column when present. */
  sideNavLane: number;
  gridColumns: 3;
  gridRows: 2;
  /** Category/vocabulary word grid — derived only here (no local breakpoints). */
  wordGridColumns: number;
  wordGridRows: number;
  wordArtSize: number;
  wordLabelSize: number;
}

export function landscapeTokens(deviceClass: DeviceClass, uiScale = 1): LandscapeTokens {
  const scale = (n: number) => Math.round(n * uiScale);
  const sideNavSize = Math.max(48, scale(SIDE_NAV_SIZE[deviceClass]));
  return {
    gap: scale(GAP[deviceClass]),
    padInline: scale(PAD_INLINE[deviceClass]),
    padBlock: scale(PAD_BLOCK[deviceClass]),
    titleSize: scale(TITLE_SIZE[deviceClass]),
    subtitleSize: scale(SUBTITLE_SIZE[deviceClass]),
    activityCardMaxHeight: scale(ACTIVITY_CARD_MAX_H[deviceClass]),
    categoryCardWidth: Math.max(48, scale(CATEGORY_CARD_W[deviceClass])),
    categoryCardHeight: Math.max(48, scale(CATEGORY_CARD_H[deviceClass])),
    sideNavSize,
    topBarMinHeight: Math.max(48, scale(TOP_BAR_MIN_H[deviceClass])),
    heroMaxWidth: scale(HERO_MAX_W[deviceClass]),
    pageDotSize: scale(PAGE_DOT[deviceClass]),
    sideNavLane: sideNavSize + scale(GAP[deviceClass]),
    gridColumns: 3,
    gridRows: 2,
    wordGridColumns: WORD_GRID_COLS[deviceClass],
    wordGridRows: WORD_GRID_ROWS[deviceClass],
    wordArtSize: Math.max(32, scale(WORD_ART[deviceClass])),
    wordLabelSize: Math.max(12, scale(WORD_LABEL[deviceClass])),
  };
}

/** Minimum effective child touch target (dp) — AGENTS.md non-negotiable 16. */
export const LANDSCAPE_MIN_TOUCH = 48;
