# Phase 26 Plan — Landscape Practice Activities

## Purpose

Migrate all current practice activity screens to the shared landscape design system while preserving practice session logic, prompts, timing, scoring/progress, audio/TTS, completion behavior, and content selection.

This phase completes the child-feature landscape migration gate.

## Dependency

Read `docs/migration/phase-25-report.md` first.

Phase 26 may begin only when Phase 25 ends with:

`GAMES WAVE B READY FOR PHASE 26`

Otherwise stop as BLOCKED.

## In scope

Migrate every current practice mode from the registry/domain. The Phase 16 baseline expected:

1. Focus
2. Receptive
3. Cloze
4. Temptation
5. Pairs
6. Combine

Current source is authoritative.

Also:

- create/reuse a shared landscape practice-detail shell;
- preserve reducers/session/content behavior;
- preserve prompt/audio/TTS behavior;
- preserve completion/progress/navigation;
- remove obsolete portrait-only branches after parity is proven;
- add compact-phone/reference-phone/tablet visual and behavioral evidence for all modes.

## Out of scope

- Do not redesign Rewards/Parent; Phase 27.
- Do not change practice methodology/content merely for layout.
- Do not alter vocabulary domain semantics.
- Do not retire Capacitor.

## Shared practice shell

Prefer a reusable shell with slots for:

- compact title/back/status area;
- instruction/prompt region;
- primary stimulus/content area;
- answer/choice/action area;
- progress/round feedback;
- completion/reward overlay host.

Use centralized metrics only. Avoid one-off device breakpoints in individual practice screens.

## Practice-mode requirements

For each current mode, preserve its existing pedagogical interaction contract. The agent must read current reducers/screens/tests and document the exact preserved behavior rather than relying on names alone.

At minimum verify:

- prompt/instruction order;
- content selection rules;
- correct/incorrect/next behavior where applicable;
- timing/delay semantics;
- audio/TTS playback;
- progress/round updates;
- restart/back/completion behavior.

### Focus

Keep the target stimulus prominent and preserve attention/focus progression.

### Receptive

Preserve spoken/prompted identification and answer-choice behavior with large child targets.

### Cloze

Preserve sentence/prompt completion behavior and answer selection.

### Temptation

Preserve distractor/temptation rules and feedback timing.

### Pairs

Preserve pair association/matching behavior; ensure all targets fit and remain legible.

### Combine

Preserve multi-item/combination interaction and completion logic.

If current behavior differs from these descriptions, current code/tests win and the report must note it.

## Responsive behavior

- short landscape height must not clip prompt or primary controls;
- content/action hierarchy stays stable on phone/tablet;
- compact phone tightens spacing before reducing legibility/content;
- tablet uses max widths and balanced whitespace;
- avoid default long vertical scrolling during active child practice.

## Tests

For every current practice mode:

- route from Practice hub works;
- representative session path progresses/completes;
- correct/incorrect or mode-specific branches remain correct;
- audio/TTS calls remain correct;
- restart/back behavior remains correct;
- compact phone/reference phone/tablet screenshots;
- no critical clipping/overflow;
- RTL/touch targets.

Also prove every practice registry entry has both a hub card and a migrated activity screen.

## Acceptance criteria

- [ ] Every current practice mode is landscape-complete.
- [ ] Shared practice-detail shell is reused where practical.
- [ ] Practice session/content/timing behavior is preserved.
- [ ] Audio/TTS behavior is preserved.
- [ ] Progress/completion/navigation is preserved.
- [ ] No current practice mode is missing from hub or detail coverage.
- [ ] No portrait-only child practice path remains active.
- [ ] Compact phone and tablet evidence passes.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-26-report.md` exists.

## Child Feature Completion Gate

The report must prove:

- all categories/words remain reachable;
- all registered games remain reachable and landscape-complete;
- all practice modes remain reachable and landscape-complete;
- core progress/audio/storage behavior remains intact.

## Exit condition

End with exactly one of:

`CHILD FEATURE COMPLETION GATE PASSED`

or

`BLOCKED`

Then stop.
