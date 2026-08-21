/**
 * Talki audio logic — pure, framework/DOM-free.
 * Source of truth: Talki_Audio_Integration_Pack (talki-audio-map.json / AUDIO_UX_POLICY.md).
 * Runs unmodified in the browser (as a classic <script>, exposes window.TalkiAudioLogic)
 * and in Node (via require(), for unit tests) — no DOM, no Audio(), no timers in here.
 */
(function (root) {
  'use strict';

  var MUSIC_FILES = {
    home: 'music/01_main_menu_welcome.mp3',
    gameplay_bouncy: 'music/02_gameplay_bouncy.mp3',
    gameplay_curious: 'music/03_gameplay_curious.mp3',
    gameplay_gentle: 'music/04_gameplay_gentle.mp3',
    speechOrListeningTask: 'music/05_listening_focus.mp3'
  };

  var SFX_FILES = {
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
    'interaction.invalidMove': 'sfx/22_invalid_move_soft.mp3'
  };

  // priority order: speaking > listening > voicePrompt > none
  var DUCK = {
    voicePrompt: { music: 0.32, sfx: 0.55, attackMs: 100, releaseMs: 350 },
    listening: { music: 0.18, sfx: 0.25, attackMs: 120, releaseMs: 450 },
    speaking: { music: 0.08, sfx: 0.0, attackMs: 80, releaseMs: 500 }
  };

  var VOLUMES = { master: 1.0, music: 0.42, sfx: 0.78, voicePrompt: 1.0 };
  var REWARD_SCREEN_MUSIC_MULTIPLIER = 0.72;

  var COOLDOWN_MS = { tap: 60, answer: 400, celebration: 800 };
  var MAX_SIMULTANEOUS_SFX = 3;

  var ANSWER_EVENTS = { 'answer.correct': 1, 'answer.retry': 1 };
  var CELEBRATION_EVENTS = { 'reward.star': 1, 'reward.unlock': 1, 'reward.confetti': 1, 'game.levelComplete': 1 };

  // Pairs that must never sound in the same breath — enforced by callers choosing
  // ONE event for a "final answer" moment, but kept here so tests can assert the rule.
  var NEVER_COMBINE = [
    ['answer.correct', 'game.levelComplete'],
    ['reward.unlock', 'game.levelComplete'],
    ['reward.confetti', 'game.levelComplete']
  ];

  function cooldownFor(event) {
    if (ANSWER_EVENTS[event]) return COOLDOWN_MS.answer;
    if (CELEBRATION_EVENTS[event]) return COOLDOWN_MS.celebration;
    return COOLDOWN_MS.tap;
  }

  function resolveMusicFile(stateKey) {
    if (!stateKey) return null;
    if (stateKey === 'rewardScreen') return MUSIC_FILES.home;
    return MUSIC_FILES[stateKey] || null;
  }

  /** Given which duck reasons are currently active, resolve the effective target. */
  function computeDuckTarget(flags) {
    flags = flags || {};
    if (flags.speaking) return { reason: 'speaking', music: DUCK.speaking.music, sfx: DUCK.speaking.sfx, durationMs: DUCK.speaking.attackMs };
    if (flags.listening) return { reason: 'listening', music: DUCK.listening.music, sfx: DUCK.listening.sfx, durationMs: DUCK.listening.attackMs };
    if (flags.voicePrompt) return { reason: 'voicePrompt', music: DUCK.voicePrompt.music, sfx: DUCK.voicePrompt.sfx, durationMs: DUCK.voicePrompt.attackMs };
    return { reason: null, music: 1, sfx: 1, durationMs: null };
  }

  /** Release duration to use when returning to neutral from a given last-active reason. */
  function releaseDurationFor(lastReasonKey) {
    var d = DUCK[lastReasonKey];
    return d ? d.releaseMs : DUCK.voicePrompt.releaseMs;
  }

  /**
   * Pure decision: should this SFX event actually play right now?
   * Encodes: sfx-disabled gate, hard mute while child is speaking, per-event cooldown,
   * and the max-simultaneous-SFX cap. No side effects — caller applies the result.
   */
  function shouldPlaySfx(event, ctx) {
    ctx = ctx || {};
    if (!SFX_FILES[event]) return false;
    if (ctx.sfxEnabled === false) return false;
    if (ctx.speaking) return false; // never during active child speech, not even celebrations
    var last = (ctx.lastPlay && ctx.lastPlay[event]) || 0;
    var now = ctx.now != null ? ctx.now : 0;
    if (now - last < cooldownFor(event)) return false;
    var active = ctx.activeSfxCount || 0;
    if (active >= (ctx.maxSimultaneous || MAX_SIMULTANEOUS_SFX)) return false;
    return true;
  }

  function effectiveMusicVolume(opts) {
    opts = opts || {};
    var master = opts.master != null ? opts.master : VOLUMES.master;
    var music = opts.music != null ? opts.music : VOLUMES.music;
    var userMul = opts.userMultiplier != null ? opts.userMultiplier : 1;
    var duckMul = opts.duckMultiplier != null ? opts.duckMultiplier : 1;
    var rewardMul = opts.rewardScreen ? REWARD_SCREEN_MUSIC_MULTIPLIER : 1;
    var v = master * music * userMul * duckMul * rewardMul;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function effectiveSfxVolume(opts) {
    opts = opts || {};
    var master = opts.master != null ? opts.master : VOLUMES.master;
    var sfx = opts.sfx != null ? opts.sfx : VOLUMES.sfx;
    var duckMul = opts.duckMultiplier != null ? opts.duckMultiplier : 1;
    var v = master * sfx * duckMul;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  var TalkiAudioLogic = {
    MUSIC_FILES: MUSIC_FILES,
    SFX_FILES: SFX_FILES,
    DUCK: DUCK,
    VOLUMES: VOLUMES,
    COOLDOWN_MS: COOLDOWN_MS,
    MAX_SIMULTANEOUS_SFX: MAX_SIMULTANEOUS_SFX,
    ANSWER_EVENTS: ANSWER_EVENTS,
    CELEBRATION_EVENTS: CELEBRATION_EVENTS,
    NEVER_COMBINE: NEVER_COMBINE,
    REWARD_SCREEN_MUSIC_MULTIPLIER: REWARD_SCREEN_MUSIC_MULTIPLIER,
    cooldownFor: cooldownFor,
    resolveMusicFile: resolveMusicFile,
    computeDuckTarget: computeDuckTarget,
    releaseDurationFor: releaseDurationFor,
    shouldPlaySfx: shouldPlaySfx,
    effectiveMusicVolume: effectiveMusicVolume,
    effectiveSfxVolume: effectiveSfxVolume
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TalkiAudioLogic;
  } else {
    root.TalkiAudioLogic = TalkiAudioLogic;
  }
})(typeof window !== 'undefined' ? window : globalThis);
