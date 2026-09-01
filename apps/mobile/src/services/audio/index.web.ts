import { webAudioEngine } from './webAudioEngine';
import type { AudioEngine } from './AudioEngine';

/**
 * The web entry point — see index.ts for why platform selection is done by
 * file, not a runtime `Platform.OS` branch. THE WEB TARGET IS A TEST
 * SURFACE (standing rule); `webAudioEngine` exists only so Tier 2 can prove
 * the service contract works end to end, never as evidence of native audio
 * behaviour.
 */
export const audioEngine: AudioEngine = webAudioEngine;

export type { AudioDebugState, AudioEngine, MusicStateKey, SfxEvent } from './AudioEngine';
