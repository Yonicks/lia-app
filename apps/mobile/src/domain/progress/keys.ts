/**
 * Ported verbatim from index.html 1837. Progress keys embed the fully
 * pointed word — niqqud is therefore part of the key, exactly as legacy.
 */
export function key(catId: string, word: string): string {
  return catId + ':' + word;
}
