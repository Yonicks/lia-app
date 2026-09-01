/**
 * Proves `AudioEngineCore` defers every decision to
 * `src/domain/audio/audioPolicy.ts` rather than deciding for itself, using
 * a `FakeAdapter` that records every call it receives — so "a blocked SFX
 * never reaches the player" is a literal assertion about the fake's call
 * log, not an inference. `AudioEngineCore` itself imports nothing native
 * (see audio/audioEngineCore.ts's header comment), so this file can run
 * under plain `vitest` and never touch `expo-audio`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COOLDOWN_MS,
  DUCK,
  MAX_SIMULTANEOUS_SFX,
  REWARD_SCREEN_MUSIC_MULTIPLIER,
  SFX_FILES,
  VOLUMES,
} from '@/domain/audio/audioPolicy';
import { AudioEngineCore } from '@/services/audio/audioEngineCore';
import type { AudioPlayerAdapter } from '@/services/audio/playerAdapter';

interface SfxCall {
  file: string;
  volume: number;
  onEnded: () => void;
}
interface MusicCall {
  file: string;
  volume: number;
  fadeInMs: number;
  fadeOutMs: number;
}

class FakeAdapter implements AudioPlayerAdapter {
  unlockCalls = 0;
  musicCalls: MusicCall[] = [];
  stopMusicCalls: number[] = [];
  setVolumeCalls: number[] = [];
  sfxCalls: SfxCall[] = [];
  stopAllSfxCalls = 0;
  pausedMusic = 0;
  resumedMusic = 0;
  poolFree = 3;

  unlock(): void {
    this.unlockCalls++;
  }
  crossfadeToMusic(file: string, volume: number, fadeInMs: number, fadeOutMs: number): void {
    this.musicCalls.push({ file, volume, fadeInMs, fadeOutMs });
  }
  stopMusic(fadeOutMs: number): void {
    this.stopMusicCalls.push(fadeOutMs);
  }
  setMusicVolume(volume: number): void {
    this.setVolumeCalls.push(volume);
  }
  pauseMusicImmediate(): void {
    this.pausedMusic++;
  }
  resumeMusicImmediate(): void {
    this.resumedMusic++;
  }
  playSfxFile(file: string, volume: number, onEnded: () => void): boolean {
    if (this.poolFree <= 0) return false;
    this.poolFree--;
    const wrappedOnEnded = () => {
      this.poolFree++;
      onEnded();
    };
    this.sfxCalls.push({ file, volume, onEnded: wrappedOnEnded });
    return true;
  }
  stopAllSfx(): void {
    this.stopAllSfxCalls++;
  }
}

function makeEngine(nowFn: () => number = () => 100000) {
  const adapter = new FakeAdapter();
  const engine = new AudioEngineCore(adapter, nowFn);
  return { adapter, engine };
}

describe('AudioEngineCore delegates to audioPolicy', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('a blocked SFX never reaches the player (sfxEnabled=false)', () => {
    const { adapter, engine } = makeEngine();
    engine.setSfxEnabled(false);
    engine.playSfx('ui.primaryTap');
    expect(adapter.sfxCalls).toHaveLength(0);
  });

  it('a blocked SFX never reaches the player (speaking hard-mutes sfx)', () => {
    const { adapter, engine } = makeEngine();
    engine.setChildSpeaking(true);
    engine.playSfx('answer.correct');
    expect(adapter.sfxCalls).toHaveLength(0);
  });

  it('a blocked SFX never reaches the player (cooldown not yet elapsed)', () => {
    let t = 100000;
    const { adapter, engine } = makeEngine(() => t);
    engine.playSfx('ui.primaryTap'); // tap cooldown = 60ms
    expect(adapter.sfxCalls).toHaveLength(1);
    t += COOLDOWN_MS.tap - 1;
    engine.playSfx('ui.primaryTap');
    expect(adapter.sfxCalls).toHaveLength(1); // still blocked, cooldown not elapsed
    t += 2;
    engine.playSfx('ui.primaryTap');
    expect(adapter.sfxCalls).toHaveLength(2); // now allowed
  });

  it('an unknown event never reaches the player', () => {
    const { adapter, engine } = makeEngine();
    // @ts-expect-error deliberately an invalid event, to prove the guard
    engine.playSfx('not.a.real.event');
    expect(adapter.sfxCalls).toHaveLength(0);
  });

  it('a permitted SFX plays the exact file audioPolicy.SFX_FILES maps to', () => {
    const { adapter, engine } = makeEngine();
    engine.playSfx('reward.star');
    expect(adapter.sfxCalls).toHaveLength(1);
    expect(adapter.sfxCalls[0].file).toBe(SFX_FILES['reward.star']);
  });

  it('more than MAX_SIMULTANEOUS_SFX concurrent requests do not create a 4th player call', () => {
    let t = 100000;
    const { adapter, engine } = makeEngine(() => t);
    // Use distinct events (no cooldown collisions) so only the
    // activeSfxCount cap is under test.
    engine.playSfx('ui.primaryTap');
    engine.playSfx('ui.secondaryTap');
    engine.playSfx('ui.cardAppear');
    expect(adapter.sfxCalls).toHaveLength(MAX_SIMULTANEOUS_SFX);
    engine.playSfx('ui.backOrClose'); // a 4th, distinct event, still blocked by the cap
    expect(adapter.sfxCalls).toHaveLength(MAX_SIMULTANEOUS_SFX);
    expect(adapter.sfxCalls.every((c) => c.file !== SFX_FILES['ui.backOrClose'])).toBe(true);
  });

  it('a 4th SFX becomes playable again once one of the first three ends', () => {
    let t = 100000;
    const { adapter, engine } = makeEngine(() => t);
    engine.playSfx('ui.primaryTap');
    engine.playSfx('ui.secondaryTap');
    engine.playSfx('ui.cardAppear');
    expect(adapter.sfxCalls).toHaveLength(3);
    adapter.sfxCalls[0].onEnded(); // one finishes, freeing a slot
    engine.playSfx('ui.backOrClose');
    expect(adapter.sfxCalls).toHaveLength(4);
  });

  describe('duck ramps (need a real, advancing clock)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('duck targets come from computeDuckTarget, not an engine-local constant, for all three reasons', () => {
      const adapter = new FakeAdapter();
      const engine = new AudioEngineCore(adapter, () => Date.now());

      engine.setVoicePromptPlaying(true);
      vi.advanceTimersByTime(DUCK.voicePrompt.attackMs + 32);
      expect(engine.debugState().duckMul.music).toBeCloseTo(DUCK.voicePrompt.music, 5);
      expect(engine.debugState().duckMul.sfx).toBeCloseTo(DUCK.voicePrompt.sfx, 5);

      engine.setVoicePromptPlaying(false);
      engine.setListening(true);
      vi.advanceTimersByTime(DUCK.listening.attackMs + 32);
      expect(engine.debugState().duckMul.music).toBeCloseTo(DUCK.listening.music, 5);
      expect(engine.debugState().duckMul.sfx).toBeCloseTo(DUCK.listening.sfx, 5);

      engine.setListening(false);
      engine.setChildSpeaking(true);
      vi.advanceTimersByTime(DUCK.speaking.attackMs + 32);
      expect(engine.debugState().duckMul.music).toBeCloseTo(DUCK.speaking.music, 5);
      expect(engine.debugState().duckMul.sfx).toBeCloseTo(DUCK.speaking.sfx, 5);
    });

    it('speaking hard-mutes sfx to exactly 0', () => {
      const adapter = new FakeAdapter();
      const engine = new AudioEngineCore(adapter, () => Date.now());
      engine.setChildSpeaking(true);
      vi.advanceTimersByTime(DUCK.speaking.attackMs + 32);
      expect(engine.debugState().duckMul.sfx).toBe(0);
    });

    it('releasing back to neutral uses releaseDurationFor(lastReason), converging to 1/1', () => {
      const adapter = new FakeAdapter();
      const engine = new AudioEngineCore(adapter, () => Date.now());
      engine.setListening(true);
      vi.advanceTimersByTime(DUCK.listening.attackMs + 32);
      engine.setListening(false);
      vi.advanceTimersByTime(DUCK.listening.releaseMs + 32);
      expect(engine.debugState().duckMul).toEqual({ music: 1, sfx: 1 });
    });
  });

  it('music state changes resolve through resolveMusicFile, matching audioPolicy exactly', async () => {
    const { adapter, engine } = makeEngine();
    await engine.unlock();
    await engine.setMusicState('gameplay_playroom_a');
    expect(adapter.musicCalls).toHaveLength(1);
    expect(adapter.musicCalls[0].file).toBe('music/06_talki_playroom.mp3');
  });

  it('rewardScreen applies the REWARD_SCREEN_MUSIC_MULTIPLIER from audioPolicy', async () => {
    const { adapter, engine } = makeEngine();
    await engine.unlock();
    await engine.setMusicState('rewardScreen');
    expect(adapter.musicCalls).toHaveLength(1);
    expect(adapter.musicCalls[0].file).toBe('music/01_main_menu_welcome.mp3'); // home track
    expect(adapter.musicCalls[0].volume).toBeCloseTo(
      VOLUMES.master * VOLUMES.music * REWARD_SCREEN_MUSIC_MULTIPLIER,
      5
    );
  });

  it('setMusicState(null) stops music rather than resolving a file', async () => {
    const { adapter, engine } = makeEngine();
    await engine.unlock();
    await engine.setMusicState('home');
    await engine.setMusicState(null);
    expect(adapter.stopMusicCalls.length).toBeGreaterThan(0);
  });

  it('re-requesting the same music state is a no-op (no restart), matching legacy', async () => {
    const { adapter, engine } = makeEngine();
    await engine.unlock();
    await engine.setMusicState('home');
    await engine.setMusicState('home');
    expect(adapter.musicCalls).toHaveLength(1);
  });

  it('music is queued as pending until unlock(), then flushed', async () => {
    const { adapter, engine } = makeEngine();
    await engine.setMusicState('home'); // before unlock — queued
    expect(adapter.musicCalls).toHaveLength(0);
    expect(engine.debugState().pendingMusicKey).toBe('home');
    await engine.unlock();
    expect(adapter.musicCalls).toHaveLength(1);
    expect(engine.debugState().pendingMusicKey).toBeNull();
  });

  it('stopAll() clears every duck flag and resets duck multipliers to neutral', async () => {
    const { engine } = makeEngine();
    engine.setListening(true);
    engine.setChildSpeaking(true);
    engine.setVoicePromptPlaying(true);
    await engine.stopAll();
    const state = engine.debugState();
    expect(state.duckFlags).toEqual({ voicePrompt: false, listening: false, speaking: false });
    expect(state.duckMul).toEqual({ music: 1, sfx: 1 });
    expect(state.musicKey).toBeNull();
    expect(state.activeSfxCount).toBe(0);
  });

  it('debugState() mirrors legacy _debugState() shape (tools/audio-check.js assertions port over)', async () => {
    const { engine } = makeEngine();
    await engine.unlock();
    const state = engine.debugState();
    expect(state).toHaveProperty('enabled');
    expect(state).toHaveProperty('duckFlags');
    expect(state).toHaveProperty('duckMul');
    expect(state).toHaveProperty('musicKey');
    expect(state).toHaveProperty('pendingMusicKey');
    expect(state).toHaveProperty('unlocked', true);
    expect(state).toHaveProperty('activeSfxCount');
  });

  it('setMusicEnabled(false) stops music and queues the next request as pending', async () => {
    const { adapter, engine } = makeEngine();
    await engine.unlock();
    await engine.setMusicState('home');
    engine.setMusicEnabled(false);
    expect(adapter.stopMusicCalls.length).toBeGreaterThan(0);
    await engine.setMusicState('gameplay_playroom_a');
    expect(engine.debugState().pendingMusicKey).toBe('gameplay_playroom_a');
    engine.setMusicEnabled(true);
    expect(engine.debugState().pendingMusicKey).toBeNull();
  });
});
