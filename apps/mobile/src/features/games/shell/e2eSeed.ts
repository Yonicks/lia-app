import { mulberry32 } from '@/domain/games/shuffle';

/** Test-only. Production never sets `__talkiQuizSeed` or a route `seed`. */
export function readE2ESeed(explicit?: number): number | undefined {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
  if (typeof window === 'undefined') return undefined;
  const seed = (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed;
  return typeof seed === 'number' ? seed : undefined;
}

/** Test-only. Production never sets `__talkiPlaceCorrectAt`. */
export function e2ePlaceCorrectAt(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = (window as unknown as { __talkiPlaceCorrectAt?: number }).__talkiPlaceCorrectAt;
  return typeof raw === 'number' ? raw : undefined;
}

/** Fresh generator per call so a remount cannot consume leftover PRNG state. */
export function makeRnd(explicit?: number): () => number {
  const seed = readE2ESeed(explicit);
  return typeof seed === 'number' ? mulberry32(seed) : Math.random;
}
