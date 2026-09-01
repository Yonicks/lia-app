import type { CategoryId } from '../types';

/**
 * Ported verbatim from index.html 1476-1479. Colours are the one category
 * whose files carry an extra `-shapes-` infix; every other category follows
 * `talki-{cat}-{slug}.png`. Missing this branch silently breaks 26 images
 * (see docs/migration/phases/phase-02-plan.md "The colours exception is
 * real and must survive").
 */
export function art(cat: Exclude<CategoryId, 'mine'>, slug: string): string {
  const file = cat === 'colors' ? `talki-colors-shapes-${slug}.png` : `talki-${cat}-${slug}.png`;
  return `assets/words/${cat}/${file}`;
}
