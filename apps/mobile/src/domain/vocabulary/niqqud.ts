/**
 * Ported verbatim from index.html 1828-1830.
 *
 * `display()` and `plain()` look identical in shape but serve two different
 * purposes that must stay distinct: `display()` is what the child *sees* and
 * respects the niqqud setting; `plain()` is what is *spoken* or compared for
 * correctness and always strips points, regardless of the setting.
 */
export const NIQQUD = /[\u0591-\u05C7]/g;

export function display(word: string, niqqudEnabled: boolean): string {
  return niqqudEnabled ? word : word.replace(NIQQUD, '');
}

export function plain(word: string): string {
  return word.replace(NIQQUD, '');
}
