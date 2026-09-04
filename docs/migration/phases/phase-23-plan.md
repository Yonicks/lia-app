# Phase 23 Plan — Landscape Categories and Vocabulary

## Purpose

Migrate the category and vocabulary learning experience to the approved landscape system while preserving all vocabulary content, custom/my-words behavior, audio/TTS, progress, celebrations, and category navigation.

Unlike the three main hubs, there is no dedicated Phase 23 screenshot. The visual direction therefore comes from the committed Home/Games/Practice references plus the shared landscape design system. Do not invent a completely new product language.

## Dependency

Read `docs/migration/phase-22-report.md` first.

Phase 23 may begin only when Phase 22 ends with:

`PRACTICE HUB READY FOR PHASE 23`

Otherwise stop as BLOCKED.

## In scope

1. Redesign `CategoryScreen` and its word-grid/word-tile composition for landscape.
2. Preserve all current built-in vocabulary categories.
3. Preserve synthetic/custom/my-words behavior and custom assets/data.
4. Preserve word audio/TTS and current tap/replay interactions.
5. Preserve progress/learned state, completion, and celebration behavior.
6. Preserve category-to-category/back navigation behavior.
7. Use shared landscape shell/top chrome where appropriate for a detail/learning surface.
8. Remove obsolete portrait-only category layout paths once equivalent coverage is proven.
9. Add full viewport and behavioral regression coverage.

## Out of scope

- Do not redesign individual games; Phases 24–25.
- Do not redesign practice activities; Phase 26.
- Do not redesign Parent/Rewards; Phase 27.
- Do not change vocabulary data/domain semantics.
- Do not change audio/TTS implementation unless needed for layout-safe integration.
- Do not retire Capacitor.

## Visual direction

The Category experience should feel like the same world/product as the hubs:

- landscape-first composition;
- child-friendly rounded surfaces;
- approved typography/colors/shadows;
- verified artwork;
- shared top utility/back treatment;
- generous, readable word imagery and labels;
- minimal text density;
- Hebrew RTL.

Do not simply make the old portrait grid wider.

## Landscape composition requirements

The active category view should prioritize the learning content within the short landscape height.

Prefer:

- fixed/compact top chrome;
- category title/progress in a bounded header region;
- horizontally efficient word tile/grid region;
- page/horizontal progression if the complete category cannot fit without tiny cards;
- no long vertical scrolling as the default phone experience.

Exact grid dimensions can vary by geometry/content count, but must be derived through centralized metrics and shared layout primitives.

## Content preservation

Current source is authoritative for:

- built-in category list;
- synthetic/custom category behavior;
- word order/content;
- image assets;
- custom word storage/photo behavior;
- progress semantics.

No vocabulary word/category may disappear because it is absent from a landscape mock.

## Word tiles

Each tile must:

- show verified image/art with correct aspect handling;
- render real Hebrew label text;
- keep press/audio behavior;
- expose accessible label/role;
- preserve learned/selected/progress state visuals;
- meet >=48×48 effective target.

## Audio/TTS

Verify:

- tapping a word plays the expected current audio/TTS;
- rapid navigation does not leave stale speech state;
- mute/music settings remain respected as currently defined;
- native and web test doubles remain stable.

## Custom/my words

Verify custom words can still:

- appear in the synthetic/custom category;
- use saved custom photos/assets where supported;
- play recorded/custom audio or current fallback behavior;
- retain persistence after reload/relaunch;
- open correctly from Home/category navigation.

Do not redesign the parent custom-word editor yet; Phase 27.

## Tests

At minimum cover:

- every current category reachable from Home opens;
- every word in representative categories is reachable;
- custom/my words category behavior;
- audio/TTS press behavior;
- progress/learned state;
- completion/celebration;
- back/category switching behavior;
- no critical vertical overflow at landscape viewports;
- RTL and touch targets;
- compact phone and tablet screenshots for representative small/large categories.

## Acceptance criteria

- [ ] Category/vocabulary UI is fully landscape-native, not a widened portrait layout.
- [ ] All current categories remain reachable.
- [ ] All words remain reachable.
- [ ] Custom/my-words behavior remains functional.
- [ ] Audio/TTS behavior is preserved.
- [ ] Progress/completion/celebration behavior is preserved.
- [ ] Verified image aspect handling avoids stretching.
- [ ] Compact phones and tablets pass layout review.
- [ ] No feature-local breakpoint hacks are added.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-23-report.md` exists.

## Exit condition

End with exactly one of:

`CATEGORIES READY FOR PHASE 24`

or

`BLOCKED`

Then stop.
