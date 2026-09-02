import { STAR_STEP } from './stars';

/** index.html 3451 — celebrate only when a newly learned word lands on the ladder. */
export function shouldCelebrate(learnedSize: number): boolean {
  return learnedSize > 0 && learnedSize % STAR_STEP === 0;
}

export function celebrateTitle(learnedSize: number): string {
  return `${learnedSize} מילים!`;
}
