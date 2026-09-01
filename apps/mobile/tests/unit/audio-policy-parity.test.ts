/**
 * Differential test: loads assets/audio/audio-logic.js (the legacy,
 * already-DOM-free module) via require() alongside the TypeScript port in
 * apps/mobile/src/domain/audio/audioPolicy.ts and compares them
 * EXHAUSTIVELY rather than by sampling — see docs/migration/validation.md
 * §2 "Audio policy" for the exact matrix this is required to cover.
 */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as Port from '@/domain/audio/audioPolicy';

const require = createRequire(import.meta.url);
const Legacy = require(resolve(__dirname, '../../../../assets/audio/audio-logic.js'));

const SFX_EVENTS: string[] = Object.keys(Legacy.SFX_FILES);
const MUSIC_KEYS: string[] = Object.keys(Legacy.MUSIC_FILES);
const DUCK_FLAG_COMBOS = [
  { speaking: false, listening: false, voicePrompt: false },
  { speaking: false, listening: false, voicePrompt: true },
  { speaking: false, listening: true, voicePrompt: false },
  { speaking: false, listening: true, voicePrompt: true },
  { speaking: true, listening: false, voicePrompt: false },
  { speaking: true, listening: false, voicePrompt: true },
  { speaking: true, listening: true, voicePrompt: false },
  { speaking: true, listening: true, voicePrompt: true },
];

describe('audio policy: static maps and constants', () => {
  it('has 22 SFX events, identical between legacy and port', () => {
    expect(SFX_EVENTS).toHaveLength(22);
    expect(Port.SFX_FILES).toEqual(Legacy.SFX_FILES);
  });

  it('has 10 music states, identical between legacy and port', () => {
    expect(MUSIC_KEYS).toHaveLength(10);
    expect(Port.MUSIC_FILES).toEqual(Legacy.MUSIC_FILES);
  });

  it('DUCK, VOLUMES, COOLDOWN_MS, MAX_SIMULTANEOUS_SFX, REWARD_SCREEN_MUSIC_MULTIPLIER are identical', () => {
    expect(Port.DUCK).toEqual(Legacy.DUCK);
    expect(Port.VOLUMES).toEqual(Legacy.VOLUMES);
    expect(Port.COOLDOWN_MS).toEqual(Legacy.COOLDOWN_MS);
    expect(Port.MAX_SIMULTANEOUS_SFX).toBe(Legacy.MAX_SIMULTANEOUS_SFX);
    expect(Port.REWARD_SCREEN_MUSIC_MULTIPLIER).toBe(Legacy.REWARD_SCREEN_MUSIC_MULTIPLIER);
  });

  it('NEVER_COMBINE pairs are identical', () => {
    expect(Port.NEVER_COMBINE).toEqual(Legacy.NEVER_COMBINE);
  });
});

describe('computeDuckTarget: all 8 combinations of {speaking, listening, voicePrompt}', () => {
  it.each(DUCK_FLAG_COMBOS)('%o', (flags) => {
    expect(Port.computeDuckTarget(flags)).toEqual(Legacy.computeDuckTarget(flags));
  });
});

describe('shouldPlaySfx: all 22 events x cooldown boundaries x activeSfxCount 0..4', () => {
  const OFFSETS = [-1, 0, 1]; // t-1, t, t+1 relative to the cooldown boundary
  const ACTIVE_COUNTS = [0, 1, 2, 3, 4];

  for (const event of SFX_EVENTS) {
    const cooldown = Legacy.cooldownFor(event);
    describe(`${event} (cooldown ${cooldown}ms)`, () => {
      for (const offset of OFFSETS) {
        for (const activeSfxCount of ACTIVE_COUNTS) {
          const now = cooldown + offset;
          const ctx = { now, lastPlay: { [event]: 0 }, activeSfxCount, sfxEnabled: true, speaking: false };
          it(`now=cooldown${offset >= 0 ? '+' : ''}${offset}, active=${activeSfxCount}`, () => {
            expect(Port.shouldPlaySfx(event, ctx)).toBe(Legacy.shouldPlaySfx(event, ctx));
          });
        }
      }
    });

    it(`${event}: sfxEnabled=false always blocks`, () => {
      const ctx = { now: 10_000, lastPlay: {}, activeSfxCount: 0, sfxEnabled: false };
      expect(Port.shouldPlaySfx(event, ctx)).toBe(Legacy.shouldPlaySfx(event, ctx));
      expect(Port.shouldPlaySfx(event, ctx)).toBe(false);
    });

    it(`${event}: speaking=true always blocks, even celebrations`, () => {
      const ctx = { now: 10_000, lastPlay: {}, activeSfxCount: 0, sfxEnabled: true, speaking: true };
      expect(Port.shouldPlaySfx(event, ctx)).toBe(Legacy.shouldPlaySfx(event, ctx));
      expect(Port.shouldPlaySfx(event, ctx)).toBe(false);
    });
  }

  it('unknown event never plays', () => {
    const ctx = { now: 10_000, lastPlay: {}, activeSfxCount: 0, sfxEnabled: true };
    expect(Port.shouldPlaySfx('nonexistent.event', ctx)).toBe(
      Legacy.shouldPlaySfx('nonexistent.event', ctx),
    );
    expect(Port.shouldPlaySfx('nonexistent.event', ctx)).toBe(false);
  });
});

describe('resolveMusicFile: all 10 mapped keys, rewardScreen, null, unknown', () => {
  it.each(MUSIC_KEYS)('%s', (k) => {
    expect(Port.resolveMusicFile(k)).toBe(Legacy.resolveMusicFile(k));
  });

  it('rewardScreen resolves to the home track in both', () => {
    expect(Port.resolveMusicFile('rewardScreen')).toBe(Legacy.resolveMusicFile('rewardScreen'));
    expect(Port.resolveMusicFile('rewardScreen')).toBe(Port.resolveMusicFile('home'));
  });

  it('null resolves to null in both', () => {
    expect(Port.resolveMusicFile(null)).toBe(Legacy.resolveMusicFile(null));
    expect(Port.resolveMusicFile(null)).toBeNull();
  });

  it('an unknown string resolves to null in both', () => {
    expect(Port.resolveMusicFile('totally-unknown-state')).toBe(
      Legacy.resolveMusicFile('totally-unknown-state'),
    );
    expect(Port.resolveMusicFile('totally-unknown-state')).toBeNull();
  });
});

describe('effectiveMusicVolume / effectiveSfxVolume: multiplier grid, including clamping', () => {
  const GRID = [-1, 0, 0.25, 0.5, 0.72, 1, 1.5, 2, 10];

  describe('effectiveMusicVolume', () => {
    for (const master of GRID) {
      for (const music of GRID) {
        for (const userMultiplier of GRID) {
          for (const duckMultiplier of [0, 0.5, 1]) {
            for (const rewardScreen of [false, true]) {
              const opts = { master, music, userMultiplier, duckMultiplier, rewardScreen };
              it(`master=${master} music=${music} user=${userMultiplier} duck=${duckMultiplier} reward=${rewardScreen}`, () => {
                const actual = Port.effectiveMusicVolume(opts);
                const expected = Legacy.effectiveMusicVolume(opts);
                expect(actual).toBeCloseTo(expected, 10);
                expect(actual).toBeGreaterThanOrEqual(0);
                expect(actual).toBeLessThanOrEqual(1);
              });
            }
          }
        }
      }
    }
  });

  describe('effectiveSfxVolume', () => {
    for (const master of GRID) {
      for (const sfx of GRID) {
        for (const duckMultiplier of [0, 0.5, 1]) {
          const opts = { master, sfx, duckMultiplier };
          it(`master=${master} sfx=${sfx} duck=${duckMultiplier}`, () => {
            const actual = Port.effectiveSfxVolume(opts);
            const expected = Legacy.effectiveSfxVolume(opts);
            expect(actual).toBeCloseTo(expected, 10);
            expect(actual).toBeGreaterThanOrEqual(0);
            expect(actual).toBeLessThanOrEqual(1);
          });
        }
      }
    }
  });

  it('defaults (no opts) match between legacy and port', () => {
    expect(Port.effectiveMusicVolume()).toBe(Legacy.effectiveMusicVolume());
    expect(Port.effectiveSfxVolume()).toBe(Legacy.effectiveSfxVolume());
  });
});

describe('cooldownFor: every event', () => {
  it.each(SFX_EVENTS)('%s', (event) => {
    expect(Port.cooldownFor(event as Port.SfxEvent)).toBe(Legacy.cooldownFor(event));
  });
});

describe('releaseDurationFor: every reason plus an unknown key', () => {
  const REASONS = ['voicePrompt', 'listening', 'speaking', 'unknown-reason', null, undefined];
  it.each(REASONS)('%s', (reason) => {
    expect(Port.releaseDurationFor(reason as never)).toBe(Legacy.releaseDurationFor(reason));
  });
});
