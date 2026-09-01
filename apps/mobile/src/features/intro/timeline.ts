/**
 * The Talki opening sequence's fixed timeline — DATA, not behaviour. Both
 * `IntroSequence.tsx` (which schedules a `setTimeout` per step) and
 * `intro-timeline.test.ts` / `intro.spec.ts` (which assert against it) read
 * this same array, so a timing change is a one-file edit and a test that
 * hardcodes 650 while the component hardcodes 600 can never happen
 * (phase-06-plan.md "Contracts introduced").
 *
 * These exact millisecond values come from the phase prompt's "GROUND
 * TRUTH" timeline, not from legacy's `.intro-*` CSS animations
 * (index.html 420-455, `INTRO_STAGE_MS = 4400`): the prompt deliberately
 * replaces legacy's 4.4s+0.62s sequence with a sub-two-second one for a
 * toddler app, and is explicit that this new timeline — not index.html — is
 * the source of truth for Phase 6.
 */
export type IntroLayerId = 'background' | 'star' | 'sparkles' | 'wordmark' | 'secondary';

export interface IntroStep {
  /** Milliseconds from sequence start. */
  at: number;
  layer: IntroLayerId;
  action: 'enter' | 'settle' | 'exit' | 'glow';
  durationMs: number;
}

export const INTRO_TOTAL_MS = 1800;

export const INTRO_TIMELINE: readonly IntroStep[] = [
  { at: 0, layer: 'background', action: 'enter', durationMs: 300 },
  { at: 150, layer: 'star', action: 'enter', durationMs: 300 },
  { at: 450, layer: 'sparkles', action: 'enter', durationMs: 200 },
  { at: 650, layer: 'wordmark', action: 'enter', durationMs: 300 },
  { at: 950, layer: 'secondary', action: 'settle', durationMs: 250 },
  { at: 1200, layer: 'star', action: 'glow', durationMs: 300 },
  { at: 1500, layer: 'background', action: 'exit', durationMs: 300 },
] as const;
