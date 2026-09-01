import { useCallback } from 'react';

import { audioEngine, type SfxEvent } from '@/services/audio';

import type { IntroStep } from './timeline';

/**
 * "Wire an audio hook through AudioEngine. There is no intro sound asset
 * yet; build the hook anyway so one can be dropped in later without
 * touching the animation" (phase-06-plan.md work item 5). `INTRO_SFX_MAP`
 * is deliberately empty today — there is no `SfxEvent` in
 * `domain/audio/audioPolicy.ts` for any intro beat, and inventing one would
 * be exactly the kind of "no placeholder" violation the phase forbids for
 * visual assets, applied to audio. Dropping a real beat in later is a
 * one-line addition to this map, and `IntroSequence.tsx` never changes.
 *
 * Deliberately does NOT call `audioEngine.unlock()`: unlock must run inside
 * a real user gesture (index.html 4068-4084 / `AudioEngine.unlock()` doc),
 * and the intro can start before any gesture happens. The sequence is
 * built to look and read correctly with the map empty and no sound at all.
 */
const INTRO_SFX_MAP: Partial<Record<string, SfxEvent>> = {};

function beatKey(step: Pick<IntroStep, 'layer' | 'action'>): string {
  return `${step.layer}.${step.action}`;
}

export function useIntroAudio(): { playBeat: (step: Pick<IntroStep, 'layer' | 'action'>) => void } {
  const playBeat = useCallback((step: Pick<IntroStep, 'layer' | 'action'>) => {
    const event = INTRO_SFX_MAP[beatKey(step)];
    if (event) audioEngine.playSfx(event);
  }, []);

  return { playBeat };
}
