/**
 * The only surface `AudioEngineCore` touches for actual I/O. Everything
 * that differs between "real speakers on a device" and "an HTMLAudioElement
 * in a Playwright browser" lives behind this interface — `AudioEngineCore`
 * itself contains no platform code and no policy of its own (see
 * audioEngineCore.ts's header comment and phase-04-plan.md, "The policy is
 * already ported, so AudioEngine is only the runtime").
 *
 * Tier 1 (audio-engine.test.ts) injects a `FakeAdapter` here specifically
 * so it can assert "a blocked SFX never reaches the player": the fake
 * records every call it receives, and the test proves `playSfxFile` is
 * never called when `audioPolicy.shouldPlaySfx` says no.
 */
export interface AudioPlayerAdapter {
  /** Called once per `unlock()`. Mirrors legacy `AudioManager.unlock()`
   *  (audio-manager.js 199-208): play-then-immediately-pause every pooled
   *  element from within the real user gesture, so later programmatic
   *  `.play()` calls are not blocked by autoplay policy. */
  unlock(): void | Promise<void>;
  /** Crossfade the active music track to `file` at `volume`, fading the
   *  outgoing track down over `fadeOutMs` and the incoming one up over
   *  `fadeInMs`. Mirrors `crossfadeTo()` (audio-manager.js 96-108). */
  crossfadeToMusic(file: string, volume: number, fadeInMs: number, fadeOutMs: number): void;
  /** Fades the currently active music track to silence over `fadeOutMs`,
   *  then stops it. Mirrors `stopMusic()` (audio-manager.js 111-116). */
  stopMusic(fadeOutMs: number): void;
  /** Applies `volume` to whichever music track is currently active,
   *  without restarting it. Mirrors `applyMusicVolumeNow()`
   *  (audio-manager.js 92-94). */
  setMusicVolume(volume: number): void;
  /** Pause the active music track immediately, no fade — used only for the
   *  background-lifecycle transition, mirroring the `visibilitychange`
   *  handler (audio-manager.js 220-228). */
  pauseMusicImmediate(): void;
  /** Resume the active music track immediately, no fade — the matching
   *  foreground half of the same handler. */
  resumeMusicImmediate(): void;
  /**
   * Attempts to play `file` at `volume` from the SFX pool. Returns `false`
   * (and must not play anything) if the pool has no free slot — mirrors
   * "pool exhausted — silently drop rather than cut off another sound"
   * (audio-manager.js 162). Calls `onEnded` exactly once, when playback
   * completes naturally.
   */
  playSfxFile(file: string, volume: number, onEnded: () => void): boolean;
  /** Stops every pooled SFX voice immediately. Mirrors `stopAll()`
   *  (audio-manager.js 233-236). */
  stopAllSfx(): void;
}
