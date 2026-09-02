import { WORDS_ASSETS } from '../../data/assets/words.generated';
import type { TalkiWord } from '../types';

/**
 * Resolves a built-in `TalkiWord.img` (an `art(cat, slug)` path string) to
 * its bundled Metro asset via the generated registry. Custom ('mine')
 * words carry `photo` instead and are handled separately by the caller —
 * see types.ts.
 */
export function wordImage(word: TalkiWord): number | undefined {
  return word.img ? WORDS_ASSETS[word.img] : undefined;
}
