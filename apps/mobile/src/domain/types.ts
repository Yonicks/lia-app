/**
 * Domain types ported from Talki's legacy runtime (index.html). These are
 * transcriptions of the legacy object shapes, not a redesign — see
 * docs/migration/phases/phase-02-plan.md "The port is a transcription, not a
 * redesign" for why field names, optionality and nesting are preserved
 * as-is rather than normalised.
 */

/** The ten built-in category ids (index.html 1480-1592) plus the synthetic
 *  'mine' category injected by allCats() for custom words (index.html
 *  1831-1834). */
export type CategoryId =
  | 'animals'
  | 'food'
  | 'colors'
  | 'home'
  | 'family'
  | 'body'
  | 'actions'
  | 'numbers'
  | 'outside'
  | 'emotions'
  | 'mine';

/** The 11 game ids (index.html 2355-2377). */
export type GameId =
  | 'quiz'
  | 'memory'
  | 'missing'
  | 'match'
  | 'cards'
  | 'sounds'
  | 'count'
  | 'sort'
  | 'bubbles'
  | 'puzzle'
  | 'speech';

/** The 6 practice mode ids (index.html 1383-1387, 2218-2225). */
export type PracticeModeId = 'focus' | 'receptive' | 'cloze' | 'temptation' | 'pairs' | 'combine';

/**
 * A single vocabulary item. All 182 built-in words carry `word`, `emoji`,
 * `img` and `shape`; exactly 17 additionally carry `sound` (index.html
 * 1480-1592). Custom ('mine') words never carry `img`, `shape` or `sound` —
 * they carry `photo` instead (index.html 1831-1834, media() at 2069-2072).
 */
export interface TalkiWord {
  /** Hebrew, fully pointed (niqqud preserved byte-for-byte). */
  word: string;
  emoji: string;
  /** Legacy path produced by art(cat, slug) — the asset registry lookup key.
   *  Absent on custom words. */
  img?: string;
  /** Puzzle dedup tag. Absent on custom words. */
  shape?: string;
  /** Onomatopoeia; present on exactly 17 built-in animal words. */
  sound?: string;
  /** Custom words only — a data URL or similar, captured by the parent. */
  photo?: string;
  /** Custom words only — assigned when the word is added (index.html custom
   *  item shape is {id, word, emoji, photo}). */
  id?: string;
}

export interface TalkiCategory {
  id: CategoryId;
  title: string;
  icon: string;
  /** CSS class name from the legacy stylesheet. Has no React Native meaning
   *  on its own — carried because Phase 5 uses it as the category-to-colour
   *  mapping key (see phase-02-plan.md "cls has no React Native meaning"). */
  cls: string;
  items: TalkiWord[];
}

export interface WordStats {
  seen: number;
  wrong: number;
}

export interface TalkiSettings {
  rate: number;
  niqqud: boolean;
  sounds: boolean;
  effects: boolean;
  music: boolean;
  musicVol: number;
  voice: boolean;
  /** Runtime key, absent from the settings-defaults literal itself but must
   *  round-trip (index.html 1771): ISO timestamp of the last export. */
  lastBackup?: string;
  /** Runtime key, absent from the settings-defaults literal itself but must
   *  round-trip (index.html 2973-2978): adaptive puzzle difficulty, 1..5. */
  puzzleLevel?: number;
}

/** A practice-mode home card, index.html 1383-1387 (HOME_PRACTICE_HOME) and
 *  2218-2225 (PRACTICE_LIST, the fuller 6-tuple form used by the practice
 *  screen itself). */
export interface HomePracticeCard {
  id: PracticeModeId;
  title: string;
  description: string;
  variant: string;
}

/** One entry of PRACTICE_LIST — legacy stores this as a 6-tuple
 *  [id, icon, title, description, cardId, variant?] (index.html 2218-2225).
 *  `variant` is absent on two entries (temptation, pairs), matching legacy. */
export type PracticeListEntry = [
  id: PracticeModeId,
  icon: string,
  title: string,
  description: string,
  cardId: string,
  variant?: string,
];

export interface ClozeEntry {
  phrase: string;
  answer: string;
  emoji: string;
  img?: string;
}

export interface PairWord {
  word: string;
  emoji: string;
  img?: string;
}

export type PairEntry = [PairWord, PairWord];

export interface ModifierEntry {
  w: string;
  emoji: string;
  img?: string;
  expand: string;
}

export type StickerUnlockKind = 'milestone' | 'complete' | 'word';

export interface Sticker {
  img: string;
  cat: CategoryId | null;
  word?: string;
  /** Present only on the 3 milestone stickers (star/sparkle/gift). */
  milestone?: number;
  /** Present only on the 1 "whole category complete" sticker (numbers). */
  complete?: true;
}

export interface GameMenuEntry {
  id: GameId;
  title: string;
}
