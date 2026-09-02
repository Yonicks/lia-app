/**
 * Ported from index.html 1847 (`shuffle`). Randomness is injected so a
 * test can make a permutation deterministic without stubbing
 * `Math.random` globally (phase-08 prompt).
 */
export function shuffle<T>(items: T[], rnd: () => number = Math.random): T[] {
  const x = [...items];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = x[i];
    x[i] = x[j]!;
    x[j] = tmp!;
  }
  return x;
}

/** Tiny seeded generator for tests — not legacy's `rnd()`, which is a
 *  web-only `?seed=` hook. Same contract: `() => number` in `[0, 1)`. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
