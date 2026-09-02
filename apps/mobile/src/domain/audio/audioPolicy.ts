/**
 * Ported from assets/audio/audio-logic.js, which is already DOM-free
 * CommonJS with no timers and no Audio() — this is a direct transcription:
 * every constant name and every numeric value is identical. The differential
 * test (apps/mobile/tests/unit/audio-policy-parity.test.ts) `require()`s the
 * original module alongside this one and compares them exhaustively.
 *
 * Source of truth: Talki_Audio_Integration_Pack
 * (talki-audio-map.json / AUDIO_UX_POLICY.md), as documented in the legacy
 * file's own header comment.
 */

export const MUSIC_FILES = {
  home: 'music/01_main_menu_welcome.mp3',
  gameplay_playroom_a: 'music/06_talki_playroom.mp3',
  gameplay_playroom_b: 'music/07_talki_playroom_b.mp3',
  gameplay_discoveries_a: 'music/08_little_discoveries_a.mp3',
  gameplay_discoveries_b: 'music/09_little_discoveries_b.mp3',
  gameplay_parade_a: 'music/10_sunny_card_parade_a.mp3',
  gameplay_parade_b: 'music/11_sunny_card_parade_b.mp3',
  gameplay_carousel_a: 'music/12_warm_card_carousel_a.mp3',
  gameplay_carousel_b: 'music/13_warm_card_carousel_b.mp3',
  speechOrListeningTask: 'music/05_listening_focus.mp3',
} as const;

export type MusicStateKey = keyof typeof MUSIC_FILES;

export const SFX_FILES = {
  'ui.primaryTap': 'sfx/01_ui_tap.mp3',
  'ui.secondaryTap': 'sfx/02_ui_soft_tap.mp3',
  'ui.cardAppear': 'sfx/03_ui_pop.mp3',
  'ui.backOrClose': 'sfx/04_ui_back_close.mp3',
  'ui.swipe': 'sfx/05_ui_swipe_whoosh.mp3',
  'interaction.dragPickup': 'sfx/06_drag_pickup.mp3',
  'interaction.dragDrop': 'sfx/07_drag_drop_place.mp3',
  'answer.correct': 'sfx/08_correct_answer.mp3',
  'answer.retry': 'sfx/09_try_again_gentle.mp3',
  'reward.star': 'sfx/10_star_collect.mp3',
  'reward.unlock': 'sfx/11_reward_unlock.mp3',
  'reward.confetti': 'sfx/12_confetti_burst.mp3',
  'game.levelStart': 'sfx/13_level_start.mp3',
  'game.levelComplete': 'sfx/14_level_complete.mp3',
  'game.countdownTick': 'sfx/15_countdown_tick.mp3',
  'game.countdownGo': 'sfx/16_countdown_go.mp3',
  'system.softAttention': 'sfx/17_notification_soft.mp3',
  'speech.listeningReady': 'sfx/18_listening_ready.mp3',
  'speech.recognized': 'sfx/19_voice_heard_success.mp3',
  'speech.finished': 'sfx/20_voice_finished.mp3',
  'interaction.correctMatch': 'sfx/21_match_snap.mp3',
  'interaction.invalidMove': 'sfx/22_invalid_move_soft.mp3',
} as const;

export type SfxEvent = keyof typeof SFX_FILES;

// priority order: speaking > listening > voicePrompt > none
export const DUCK = {
  voicePrompt: { music: 0.32, sfx: 0.55, attackMs: 100, releaseMs: 350 },
  listening: { music: 0.18, sfx: 0.25, attackMs: 120, releaseMs: 450 },
  speaking: { music: 0.08, sfx: 0.0, attackMs: 80, releaseMs: 500 },
} as const;

export type DuckReason = keyof typeof DUCK;

export const VOLUMES = { master: 1.0, music: 0.42, sfx: 0.78, voicePrompt: 1.0 };
export const REWARD_SCREEN_MUSIC_MULTIPLIER = 0.72;

export const COOLDOWN_MS = { tap: 60, answer: 400, celebration: 800 };
export const MAX_SIMULTANEOUS_SFX = 3;

export const ANSWER_EVENTS: Partial<Record<SfxEvent, 1>> = {
  'answer.correct': 1,
  'answer.retry': 1,
};
export const CELEBRATION_EVENTS: Partial<Record<SfxEvent, 1>> = {
  'reward.star': 1,
  'reward.unlock': 1,
  'reward.confetti': 1,
  'game.levelComplete': 1,
};

// Pairs that must never sound in the same breath. Enforced by
// `neverCombineBlocked` inside `shouldPlaySfx` when a partner was just played.
export const NEVER_COMBINE: [SfxEvent, SfxEvent][] = [
  ['answer.correct', 'game.levelComplete'],
  ['reward.unlock', 'game.levelComplete'],
  ['reward.confetti', 'game.levelComplete'],
];

export function cooldownFor(event: SfxEvent): number {
  if (ANSWER_EVENTS[event]) return COOLDOWN_MS.answer;
  if (CELEBRATION_EVENTS[event]) return COOLDOWN_MS.celebration;
  return COOLDOWN_MS.tap;
}

export function resolveMusicFile(stateKey: string | null | undefined): string | null {
  if (!stateKey) return null;
  if (stateKey === 'rewardScreen') return MUSIC_FILES.home;
  return (MUSIC_FILES as Record<string, string>)[stateKey] || null;
}

export interface DuckFlags {
  speaking?: boolean;
  listening?: boolean;
  voicePrompt?: boolean;
}

export interface DuckTarget {
  reason: DuckReason | null;
  music: number;
  sfx: number;
  durationMs: number | null;
}

/** Given which duck reasons are currently active, resolve the effective target. */
export function computeDuckTarget(flags?: DuckFlags): DuckTarget {
  const f = flags || {};
  if (f.speaking) {
    return {
      reason: 'speaking',
      music: DUCK.speaking.music,
      sfx: DUCK.speaking.sfx,
      durationMs: DUCK.speaking.attackMs,
    };
  }
  if (f.listening) {
    return {
      reason: 'listening',
      music: DUCK.listening.music,
      sfx: DUCK.listening.sfx,
      durationMs: DUCK.listening.attackMs,
    };
  }
  if (f.voicePrompt) {
    return {
      reason: 'voicePrompt',
      music: DUCK.voicePrompt.music,
      sfx: DUCK.voicePrompt.sfx,
      durationMs: DUCK.voicePrompt.attackMs,
    };
  }
  return { reason: null, music: 1, sfx: 1, durationMs: null };
}

/** Release duration to use when returning to neutral from a given last-active reason. */
export function releaseDurationFor(lastReasonKey: string | null | undefined): number {
  const d = lastReasonKey ? (DUCK as Record<string, (typeof DUCK)[DuckReason]>)[lastReasonKey] : undefined;
  return d ? d.releaseMs : DUCK.voicePrompt.releaseMs;
}

export interface ShouldPlaySfxCtx {
  sfxEnabled?: boolean;
  speaking?: boolean;
  lastPlay?: Partial<Record<string, number>>;
  now?: number;
  activeSfxCount?: number;
  maxSimultaneous?: number;
}

/**
 * Pure decision: should this SFX event actually play right now?
 * Encodes: sfx-disabled gate, hard mute while child is speaking, per-event cooldown,
 * and the max-simultaneous-SFX cap. No side effects — caller applies the result.
 */
export function shouldPlaySfx(event: string, ctx?: ShouldPlaySfxCtx): boolean {
  const c = ctx || {};
  if (!(SFX_FILES as Record<string, string>)[event]) return false;
  if (c.sfxEnabled === false) return false;
  if (c.speaking) return false; // never during active child speech, not even celebrations
  const last = (c.lastPlay && c.lastPlay[event]) || 0;
  const now = c.now != null ? c.now : 0;
  if (now - last < cooldownFor(event as SfxEvent)) return false;
  const active = c.activeSfxCount || 0;
  if (active >= (c.maxSimultaneous || MAX_SIMULTANEOUS_SFX)) return false;
  if (neverCombineBlocked(event as SfxEvent, c.lastPlay, now)) return false;
  return true;
}

/** Native enforcement of NEVER_COMBINE (legacy D10 left this to callers).
 *  When `lastPlay` has no partner — the parity matrix — this is a no-op. */
export function neverCombineBlocked(
  event: SfxEvent,
  lastPlay: Partial<Record<string, number>> | undefined,
  now: number,
): boolean {
  if (!lastPlay) return false;
  for (const [a, b] of NEVER_COMBINE) {
    const partner = event === a ? b : event === b ? a : null;
    if (!partner) continue;
    const t = lastPlay[partner];
    if (t != null && now - t < COOLDOWN_MS.celebration) return true;
  }
  return false;
}

export interface EffectiveMusicVolumeOpts {
  master?: number;
  music?: number;
  userMultiplier?: number;
  duckMultiplier?: number;
  rewardScreen?: boolean;
}

export function effectiveMusicVolume(opts?: EffectiveMusicVolumeOpts): number {
  const o = opts || {};
  const master = o.master != null ? o.master : VOLUMES.master;
  const music = o.music != null ? o.music : VOLUMES.music;
  const userMul = o.userMultiplier != null ? o.userMultiplier : 1;
  const duckMul = o.duckMultiplier != null ? o.duckMultiplier : 1;
  const rewardMul = o.rewardScreen ? REWARD_SCREEN_MUSIC_MULTIPLIER : 1;
  const v = master * music * userMul * duckMul * rewardMul;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export interface EffectiveSfxVolumeOpts {
  master?: number;
  sfx?: number;
  duckMultiplier?: number;
}

export function effectiveSfxVolume(opts?: EffectiveSfxVolumeOpts): number {
  const o = opts || {};
  const master = o.master != null ? o.master : VOLUMES.master;
  const sfx = o.sfx != null ? o.sfx : VOLUMES.sfx;
  const duckMul = o.duckMultiplier != null ? o.duckMultiplier : 1;
  const v = master * sfx * duckMul;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
