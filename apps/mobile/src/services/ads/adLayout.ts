import { AD_FALLBACK_PX } from './adConfig';

/** index.html 4113-4129 — reserved banner height. 0 when no ad. */
export function reservedAdHeight(present: boolean, reported: number | null | undefined): number {
  if (!present) return 0;
  if (reported == null || reported <= 0) return AD_FALLBACK_PX;
  return reported;
}

/**
 * Compose the three bottom contributions exactly once each
 * (phase-13-plan.md). Callers that already sit above a navigator tab bar
 * pass tabBarHeight = 0 so it is not counted twice.
 */
export function composeContentBottom(
  insetBottom: number,
  tabBarHeight: number,
  adReserved: number,
): number {
  return insetBottom + tabBarHeight + adReserved;
}

let currentReserved = 0;
const listeners = new Set<() => void>();

export function getReservedAdHeight(): number {
  return currentReserved;
}

export function setReservedAdHeight(px: number): void {
  const next = Math.max(0, px);
  if (next === currentReserved) return;
  currentReserved = next;
  listeners.forEach((l) => l());
}

export function subscribeReservedAdHeight(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
