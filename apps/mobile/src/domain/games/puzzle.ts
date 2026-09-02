import { weightedPick } from '../progress/selection';
import type { TalkiCategory, TalkiWord, WordStats } from '../types';
import { plain } from '../vocabulary/niqqud';

/** index.html 2775 */
export const PUZZLE_STEPS = [2, 3, 4, 5, 6] as const;

/** index.html 2776-2781 */
export const PUZZLE_TOGETHER = [
  'אֶפְשָׁר לְהַגִּיד אֶת זֶה יַחַד?',
  'אֵיפֹה יֵשׁ אֶצְלֵנוּ בַּבַּיִת אֶחָד כָּזֶה?',
  'מִי רוֹצֶה לְסַפֵּר לְאַבָּא אוֹ לְאִמָּא מָה בָּנִינוּ?',
] as const;

/** index.html 2785-2789 */
export function puzzleCapacity(height: number, width: number): number {
  if (height < 620 || width < 360) return 3;
  if (height < 780) return 4;
  return 6;
}

/** index.html 2791-2794 */
export function puzzleLevel(raw: unknown): number {
  const lv = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  return Math.min(Math.max(Number.isNaN(lv) ? 1 : lv, 1), PUZZLE_STEPS.length);
}

/** index.html 2795-2797 */
export function puzzleSize(level: number, capacity: number): number {
  const step = PUZZLE_STEPS[puzzleLevel(level) - 1] ?? 2;
  return Math.max(2, Math.min(step, capacity));
}

/** index.html 2973-2978 */
export function puzzleAdvance(currentLevel: number, misses: number): number {
  const lv = puzzleLevel(currentLevel);
  if (misses <= 1) return Math.min(lv + 1, PUZZLE_STEPS.length);
  if (misses >= 5) return Math.max(lv - 1, 1);
  return lv;
}

/** index.html 2872-2877 — a different scale from doneCard, on purpose. */
export function puzzleStars(misses: number): 1 | 2 | 3 {
  if (misses <= 1) return 3;
  if (misses <= 4) return 2;
  return 1;
}

/** index.html 2879 — shown when boards % 3 === 2 */
export function puzzleTogetherLine(boards: number): string | null {
  if (boards % 3 !== 2) return null;
  return PUZZLE_TOGETHER[boards % PUZZLE_TOGETHER.length] ?? null;
}

/** index.html 2802-2820 */
export function puzzlePick(
  category: TalkiCategory,
  n: number,
  stats: Record<string, WordStats>,
  rnd: () => number,
): TalkiWord[] {
  const pool = weightedPick(category.items, category.id, Math.min(category.items.length, n * 3), stats, rnd);
  const chosen: TalkiWord[] = [];
  const initials = new Set<string>();
  const shapes = new Set<string>();
  for (const it of pool) {
    if (chosen.length >= n) break;
    const first = plain(it.word)[0] ?? '';
    const sh = it.shape || 'default';
    if (initials.has(first) && pool.length - chosen.length > n) continue;
    if (shapes.has(sh) && pool.length - chosen.length > n) continue;
    initials.add(first);
    shapes.add(sh);
    chosen.push(it);
  }
  for (const it of pool) {
    if (chosen.length >= n) break;
    if (!chosen.includes(it)) chosen.push(it);
  }
  return chosen.slice(0, n);
}
