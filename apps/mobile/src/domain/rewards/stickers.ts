import type { CategoryId, Sticker } from '../types';
import { getCat } from '../vocabulary/allCats';
import { catLearned } from '../progress/totals';
import { key } from '../progress/keys';

/**
 * Ported verbatim from index.html 2417-2447 (STICKERS, stickerUnlocked()).
 * 24 stickers total across three unlock kinds:
 *   - milestone (3): learned.size >= milestone
 *   - complete (1, 'numbers'): the whole category is learned
 *   - word (20): learned.has(key(cat, word))
 * Generated from docs/migration/fixtures/legacy-domain.json.
 */
export const STICKERS: Sticker[] = [
  { img: "talki-sticker-dog.png", cat: "animals", word: "כֶּלֶב" },
  { img: "talki-sticker-cat.png", cat: "animals", word: "חָתוּל" },
  { img: "talki-sticker-elephant.png", cat: "animals", word: "פִּיל" },
  { img: "talki-sticker-rabbit.png", cat: "animals", word: "אַרְנָב" },
  { img: "talki-sticker-bird.png", cat: "animals", word: "צִפּוֹר" },
  { img: "talki-sticker-butterfly.png", cat: "animals", word: "פַּרְפַּר" },
  { img: "talki-sticker-apple.png", cat: "food", word: "תַּפּוּחַ" },
  { img: "talki-sticker-cake.png", cat: "food", word: "עוּגָה" },
  { img: "talki-sticker-icecream.png", cat: "food", word: "גְּלִידָה" },
  { img: "talki-sticker-car.png", cat: "outside", word: "מְכוֹנִית" },
  { img: "talki-sticker-house.png", cat: "outside", word: "בַּיִת" },
  { img: "talki-sticker-sun.png", cat: "outside", word: "שֶׁמֶשׁ" },
  { img: "talki-sticker-tree.png", cat: "outside", word: "עֵץ" },
  { img: "talki-sticker-balloon.png", cat: "colors", word: "בָּלוֹן" },
  { img: "talki-sticker-heart.png", cat: "colors", word: "לֵב" },
  { img: "talki-sticker-flower.png", cat: "colors", word: "פֶּרַח" },
  { img: "talki-sticker-rainbow.png", cat: "colors", word: "צִבְעוֹנִי" },
  { img: "talki-sticker-ball.png", cat: "home", word: "כַּדּוּר" },
  { img: "talki-sticker-kid-boy.png", cat: "family", word: "אָח" },
  { img: "talki-sticker-kid-girl.png", cat: "family", word: "יַלְדָּה" },
  { img: "talki-sticker-numbers.png", cat: "numbers", complete: true },
  { img: "talki-sticker-star.png", cat: null, milestone: 1 },
  { img: "talki-sticker-sparkle.png", cat: null, milestone: 25 },
  { img: "talki-sticker-gift.png", cat: null, milestone: 75 },
];

/**
 * Ported verbatim from index.html 2443-2446. Legacy reads module-level
 * `learned` directly; the port takes it as a parameter (see allCats.ts —
 * Phase 2 has no storage layer yet).
 */
export function stickerUnlocked(
  s: Sticker,
  learned: ReadonlySet<string>,
  custom: import('../types').TalkiWord[] = [],
): boolean {
  if (s.milestone != null) return learned.size >= s.milestone;
  if (s.complete) {
    const c = getCat(s.cat as CategoryId, custom);
    return !!c && c.items.length > 0 && catLearned(c, learned) >= c.items.length;
  }
  return learned.has(key(s.cat as CategoryId, s.word as string));
}
