import { expoAudioEngine } from './expoAudioEngine';
import type { AudioEngine } from './AudioEngine';

/**
 * The native entry point (iOS/Android, and Metro's fallback for any
 * platform without a more specific file). `index.web.ts` is the web entry
 * point — same file-extension-selection mechanism Phase 3 used for
 * `services/storage` (see phase-03-report.md "Deviations" §1), so
 * `expo-audio`'s native module is structurally excluded from the web
 * bundle's module graph, and the DOM-only `webAudioEngine.ts` is
 * structurally excluded from a native build.
 */
export const audioEngine: AudioEngine = expoAudioEngine;

export type { AudioDebugState, AudioEngine, MusicStateKey, SfxEvent } from './AudioEngine';
