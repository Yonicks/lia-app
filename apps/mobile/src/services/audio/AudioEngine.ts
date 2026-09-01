import type { MusicStateKey, SfxEvent } from '../../domain/audio/audioPolicy';

export type { MusicStateKey, SfxEvent } from '../../domain/audio/audioPolicy';

/** Read-only snapshot, mirroring legacy `AudioManager._debugState()`
 *  (audio-manager.js 240-251), which `tools/audio-check.js` already asserts
 *  against — keeping this shape means those assertions port over unchanged
 *  (phase-04-plan.md, "Contracts introduced"). `enabled` carries only
 *  `music`/`sfx` here, not `voice`: this interface has no
 *  `setVoiceEnabled`, because voice gating is `WordVoiceService`'s concern
 *  (the `settings.voice` gate lives there, not in the music/SFX runtime) —
 *  see word-voice.test.ts. */
export interface AudioDebugState {
  enabled: { music: boolean; sfx: boolean };
  duckFlags: { voicePrompt: boolean; listening: boolean; speaking: boolean };
  duckMul: { music: number; sfx: number };
  musicKey: MusicStateKey | 'rewardScreen' | null;
  pendingMusicKey: MusicStateKey | 'rewardScreen' | null;
  unlocked: boolean;
  activeSfxCount: number;
}

/**
 * The one interface every screen, game and domain module is allowed to
 * touch for music/SFX/ducking. No direct `expo-audio` import anywhere
 * else. `AudioEngine` is a RUNTIME only: every decision (should this SFX
 * play, what should the duck target be, which file backs this music state,
 * what the effective volume is) comes from
 * `src/domain/audio/audioPolicy.ts`, proven correct in Phase 2 by an
 * exhaustive differential test against the legacy pure module. This
 * interface's implementations must never hold a second copy of any duck
 * value, cooldown or volume constant (phase-04-plan.md, "The policy is
 * already ported, so AudioEngine is only the runtime").
 */
export interface AudioEngine {
  /** Must be called from within a real user gesture — mirrors legacy
   *  `unlockAudio()` (index.html 4068-4084) / `AudioManager.unlock()`
   *  (audio-manager.js 199-208). Idempotent. */
  unlock(): Promise<void>;
  setMusicState(state: MusicStateKey | 'rewardScreen' | null): Promise<void>;
  playSfx(event: SfxEvent): void;
  setListening(on: boolean): void;
  setChildSpeaking(on: boolean): void;
  setVoicePromptPlaying(on: boolean): void;
  setMusicEnabled(on: boolean): void;
  setSfxEnabled(on: boolean): void;
  setMusicVolumeMultiplier(v: number): void;
  stopMusic(fadeOutMs?: number): Promise<void>;
  stopAll(): Promise<void>;
  /** Read-only snapshot mirroring legacy `_debugState()`. */
  debugState(): AudioDebugState;
}
