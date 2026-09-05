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

/**
 * Activity card (games/practice) — width is grid-driven; these cap height.
 * Raised from the original 118–190 range: that ceiling bound cards well
 * below what the 3×2 grid's own flex space actually offers on any viewport
 * roomier than a real ad-bearing phone (desktop/tablet web preview, and any
 * device where `useLandscapeLayout()`'s ad-aware `usableHeight` still
 * leaves slack), producing large dead gaps between the two rows that the
 * reference mock's tightly-packed grid never has. On a genuinely tight
 * device (phone class + a live ad banner), real flex space is already
 * below even the old ceiling, so raising it changes nothing there — it
 * only stops clamping cards on the viewports that had room to spare.
 */
const ACTIVITY_CARD_MAX_H: Record<DeviceClass, number> = {
  compactPhone: 150,
  phone: 180,
  tablet: 260,
  largeTablet: 300,
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

/**
 * Game-detail board metrics (Phase 24). Derived only from DeviceClass —
 * feature screens must not invent width/height breakpoints for quiz grids,
 * memory columns, missing cards, match rows, or cards stage width.
 */
export type QuizGridMode = '2x2' | '1x4';

const GAME_TITLE: Record<DeviceClass, number> = {
  compactPhone: 16,
  phone: 18,
  tablet: 22,
  largeTablet: 24,
};

const QUIZ_OPTION_MIN: Record<DeviceClass, number> = {
  compactPhone: 72,
  phone: 84,
  tablet: 108,
  largeTablet: 120,
};

const MEMORY_CARD_MIN: Record<DeviceClass, number> = {
  compactPhone: 56,
  phone: 64,
  tablet: 88,
  largeTablet: 96,
};

const MISSING_CARD: Record<DeviceClass, number> = {
  compactPhone: 68,
  phone: 80,
  tablet: 100,
  largeTablet: 110,
};

const MATCH_ROW_MIN: Record<DeviceClass, number> = {
  compactPhone: 48,
  phone: 52,
  tablet: 64,
  largeTablet: 72,
};

const CARDS_STAGE_MAX_W: Record<DeviceClass, number> = {
  compactPhone: 420,
  phone: 480,
  tablet: 720,
  largeTablet: 820,
};

const QUIZ_GRID_MODE: Record<DeviceClass, QuizGridMode> = {
  compactPhone: '2x2',
  phone: '2x2',
  tablet: '1x4',
  largeTablet: '1x4',
};

/**
 * Game-detail board metrics (Phase 25 Wave B). Same DeviceClass-only rule —
 * Sounds/Count/Bubbles/Sort/Puzzle/Speech must not invent local breakpoints.
 */
const SOUNDS_OPTION_MIN: Record<DeviceClass, number> = {
  compactPhone: 72,
  phone: 84,
  tablet: 108,
  largeTablet: 120,
};

const COUNT_PIC_MAX: Record<DeviceClass, number> = {
  compactPhone: 64,
  phone: 80,
  tablet: 104,
  largeTablet: 116,
};

const COUNT_OPTION_MIN: Record<DeviceClass, number> = {
  compactPhone: 56,
  phone: 64,
  tablet: 80,
  largeTablet: 88,
};

const BUBBLE_SIZE_MIN: Record<DeviceClass, number> = {
  compactPhone: 64,
  phone: 72,
  tablet: 88,
  largeTablet: 96,
};

const BUBBLE_SIZE_MAX: Record<DeviceClass, number> = {
  compactPhone: 96,
  phone: 112,
  tablet: 132,
  largeTablet: 144,
};

const SORT_BOX_MIN: Record<DeviceClass, number> = {
  compactPhone: 72,
  phone: 88,
  tablet: 112,
  largeTablet: 124,
};

const PUZZLE_PIECE_MIN: Record<DeviceClass, number> = {
  compactPhone: 64,
  phone: 72,
  tablet: 96,
  largeTablet: 108,
};

const SPEECH_ART: Record<DeviceClass, number> = {
  compactPhone: 96,
  phone: 120,
  tablet: 160,
  largeTablet: 180,
};

/**
 * Practice-activity board metrics (Phase 26). Same DeviceClass-only rule —
 * Focus/Receptive/Cloze/Temptation/Pairs/Combine must not invent local
 * breakpoints for stimulus, options, jar, or modifier chrome.
 */
const PRACTICE_ART: Record<DeviceClass, number> = {
  compactPhone: 88,
  phone: 110,
  tablet: 140,
  largeTablet: 160,
};

const PRACTICE_WORD: Record<DeviceClass, number> = {
  compactPhone: 24,
  phone: 28,
  tablet: 34,
  largeTablet: 38,
};

const PRACTICE_OPTION_MIN: Record<DeviceClass, number> = {
  compactPhone: 72,
  phone: 84,
  tablet: 108,
  largeTablet: 120,
};

const PRACTICE_JAR: Record<DeviceClass, number> = {
  compactPhone: 48,
  phone: 56,
  tablet: 72,
  largeTablet: 80,
};

const PRACTICE_PHRASE: Record<DeviceClass, number> = {
  compactPhone: 18,
  phone: 20,
  tablet: 24,
  largeTablet: 26,
};

const PRACTICE_MOD_MIN: Record<DeviceClass, number> = {
  compactPhone: 48,
  phone: 52,
  tablet: 64,
  largeTablet: 72,
};

const PRACTICE_MOD_ART: Record<DeviceClass, number> = {
  compactPhone: 28,
  phone: 32,
  tablet: 40,
  largeTablet: 44,
};

/**
 * Rewards sticker grid (Phase 27). Prefer denser landscape pages over a
 * tall portrait wrap; paging when catalog exceeds one viewport.
 */
const STICKER_COLS: Record<DeviceClass, number> = {
  compactPhone: 8,
  phone: 8,
  tablet: 10,
  largeTablet: 12,
};

const STICKER_ROWS: Record<DeviceClass, number> = {
  compactPhone: 2,
  phone: 3,
  tablet: 3,
  largeTablet: 2,
};

const STICKER_CELL: Record<DeviceClass, number> = {
  compactPhone: 48,
  phone: 56,
  tablet: 72,
  largeTablet: 80,
};

/** Parent gate keypad key edge (adult UI — still ≥48 for reliable taps). */
const PARENT_GATE_KEY: Record<DeviceClass, number> = {
  compactPhone: 56,
  phone: 64,
  tablet: 72,
  largeTablet: 80,
};

/** Parent Center content max width on large tablets (breathing room). */
const PARENT_CONTENT_MAX_W: Record<DeviceClass, number> = {
  compactPhone: 720,
  phone: 800,
  tablet: 960,
  largeTablet: 1100,
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
  /** Compact in-game title under the landscape top bar. */
  gameTitleSize: number;
  /** Quiz option tile minimum edge (dp). */
  quizOptionMin: number;
  /** Quiz answer layout — 2×2 on phones, single row on tablets. */
  quizGridMode: QuizGridMode;
  /** Memory board column count (landscape always 4). */
  memoryColumns: 4;
  memoryCardMin: number;
  missingCardSize: number;
  matchRowMinHeight: number;
  cardsStageMaxWidth: number;
  /** Whether cards stage prefers art | controls side-by-side. */
  cardsSplitLayout: boolean;
  /** Sounds option tile minimum edge (dp). */
  soundsOptionMin: number;
  /** Sounds: phones put prompt beside options; tablets stack. */
  soundsSplitLayout: boolean;
  /** Count stage object max edge so n=5 fits the play strip. */
  countPicMax: number;
  countOptionMin: number;
  bubbleSizeMin: number;
  bubbleSizeMax: number;
  sortBoxMinHeight: number;
  /** Sort: tablet prompt | boxes side-by-side. */
  sortSplitLayout: boolean;
  puzzlePieceMin: number;
  speechArtSize: number;
  /** Focus / temptation primary stimulus max edge (dp). */
  practiceArtSize: number;
  /** Focus target word label size. */
  practiceWordSize: number;
  /** Receptive / pairs / combine picture option minimum edge (dp). */
  practiceOptionMin: number;
  /** Temptation jar emoji size. */
  practiceJarSize: number;
  /** Cloze / combine phrase text size. */
  practicePhraseSize: number;
  /** Combine modifier chip minimum height (dp). */
  practiceModMin: number;
  /** Combine modifier art edge (dp). */
  practiceModArtSize: number;
  /** Combine: tablets put modifiers beside the picture grid. */
  practiceCombineSplitLayout: boolean;
  /** Rewards sticker grid columns / rows / cell edge (Phase 27). */
  stickerColumns: number;
  stickerRows: number;
  stickerCellSize: number;
  /** Parent gate keypad key minimum edge (dp). */
  parentGateKeySize: number;
  /** Parent Center scroll content max width. */
  parentContentMaxWidth: number;
}

export function landscapeTokens(deviceClass: DeviceClass, uiScale = 1): LandscapeTokens {
  const scale = (n: number) => Math.round(n * uiScale);
  const sideNavSize = Math.max(48, scale(SIDE_NAV_SIZE[deviceClass]));
  const isTablet = deviceClass === 'tablet' || deviceClass === 'largeTablet';
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
    gameTitleSize: Math.max(14, scale(GAME_TITLE[deviceClass])),
    quizOptionMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(QUIZ_OPTION_MIN[deviceClass])),
    quizGridMode: QUIZ_GRID_MODE[deviceClass],
    memoryColumns: 4,
    memoryCardMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(MEMORY_CARD_MIN[deviceClass])),
    missingCardSize: Math.max(LANDSCAPE_MIN_TOUCH, scale(MISSING_CARD[deviceClass])),
    matchRowMinHeight: Math.max(LANDSCAPE_MIN_TOUCH, scale(MATCH_ROW_MIN[deviceClass])),
    cardsStageMaxWidth: scale(CARDS_STAGE_MAX_W[deviceClass]),
    cardsSplitLayout: isTablet,
    soundsOptionMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(SOUNDS_OPTION_MIN[deviceClass])),
    soundsSplitLayout: !isTablet,
    countPicMax: Math.max(48, scale(COUNT_PIC_MAX[deviceClass])),
    countOptionMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(COUNT_OPTION_MIN[deviceClass])),
    bubbleSizeMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(BUBBLE_SIZE_MIN[deviceClass])),
    bubbleSizeMax: Math.max(LANDSCAPE_MIN_TOUCH, scale(BUBBLE_SIZE_MAX[deviceClass])),
    sortBoxMinHeight: Math.max(LANDSCAPE_MIN_TOUCH, scale(SORT_BOX_MIN[deviceClass])),
    sortSplitLayout: isTablet,
    puzzlePieceMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(PUZZLE_PIECE_MIN[deviceClass])),
    speechArtSize: Math.max(72, scale(SPEECH_ART[deviceClass])),
    practiceArtSize: Math.max(72, scale(PRACTICE_ART[deviceClass])),
    practiceWordSize: Math.max(18, scale(PRACTICE_WORD[deviceClass])),
    practiceOptionMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(PRACTICE_OPTION_MIN[deviceClass])),
    practiceJarSize: Math.max(40, scale(PRACTICE_JAR[deviceClass])),
    practicePhraseSize: Math.max(16, scale(PRACTICE_PHRASE[deviceClass])),
    practiceModMin: Math.max(LANDSCAPE_MIN_TOUCH, scale(PRACTICE_MOD_MIN[deviceClass])),
    practiceModArtSize: Math.max(24, scale(PRACTICE_MOD_ART[deviceClass])),
    practiceCombineSplitLayout: isTablet,
    stickerColumns: STICKER_COLS[deviceClass],
    stickerRows: STICKER_ROWS[deviceClass],
    stickerCellSize: Math.max(LANDSCAPE_MIN_TOUCH, scale(STICKER_CELL[deviceClass])),
    parentGateKeySize: Math.max(LANDSCAPE_MIN_TOUCH, scale(PARENT_GATE_KEY[deviceClass])),
    parentContentMaxWidth: scale(PARENT_CONTENT_MAX_W[deviceClass]),
  };
}

/** Minimum effective child touch target (dp) — AGENTS.md non-negotiable 16. */
export const LANDSCAPE_MIN_TOUCH = 48;
