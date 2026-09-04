# Phase 27 Plan — Landscape Rewards and Parent Center

## Purpose

Migrate the remaining major product surfaces outside the core child learning flow: Rewards/Stickers and the complete Parent Gate/Parent Center experience.

The child Rewards surface should inherit the approved playful landscape world/design language. Parent surfaces should be landscape-first, clear, efficient, and consistent with Talki branding without forcing toddler-style ornamentation onto adult workflows.

## Dependency

Read `docs/migration/phase-26-report.md` first.

Phase 27 may begin only when Phase 26 ends with:

`CHILD FEATURE COMPLETION GATE PASSED`

Otherwise stop as BLOCKED.

## In scope

### Rewards

- migrate rewards/stickers/progress surfaces to landscape;
- preserve reward earning, star counts, sticker unlock state, persistence, and navigation;
- preserve child-friendly visual hierarchy and >=48×48 controls.

### Parent Gate

- migrate gate/challenge UI to landscape;
- preserve the current adult-verification/guard behavior;
- ensure exactly one guarded entry path from child chrome;
- preserve back/cancel behavior.

### Parent Center

Migrate every current Parent Center feature/tab, expected baseline:

- Method
- Record
- Report
- Settings
- Words/custom words

Also preserve all supporting flows present in current code, including where applicable:

- custom word create/edit/delete;
- photo/image picker;
- recording playback/capture;
- backup/restore/export/import;
- audio/speech/settings controls;
- progress/report views;
- form validation;
- permissions/errors/loading/empty states.

Current source is authoritative.

## Out of scope

- Do not perform final splash/intro/toast/ad/accessibility global polish; Phase 28.
- Do not change reward economics, parent-gate rules, data schemas, or backup format unless required by an already-documented bug and explicitly tested.
- Do not retire Capacitor.

## Rewards design

Rewards should:

- use shared landscape shell/top chrome when appropriate;
- clearly show real star/sticker/unlock state;
- keep reward items large and child-friendly;
- use verified reward art only;
- avoid long portrait-style vertical lists on phones when a horizontal/paged landscape composition is more appropriate;
- preserve all reward catalog reachability.

## Parent design

Parent screens may use denser adult UI, but must still:

- fit landscape phones and tablets;
- respect safe areas;
- support Hebrew RTL;
- keep text/form controls readable;
- work with the software keyboard without hiding the active field/action;
- avoid desktop-only hover assumptions;
- use a single responsive implementation rather than separate phone/tablet trees.

A bounded scroll view is acceptable/expected for adult settings/forms where content genuinely exceeds landscape height. The child no-vertical-scroll preference does not prohibit sensible adult form scrolling.

## Parent tabs/navigation

- preserve all current tabs/features;
- make tab navigation usable in short landscape height;
- ensure tab content does not remain in conflicting mounted states if current architecture has issues;
- preserve unsaved-form behavior and confirmation semantics where currently implemented;
- hardware back should not unexpectedly discard data.

## Custom words

Verify end-to-end:

- create word;
- enter Hebrew text;
- choose/capture/select image as currently supported;
- record or attach audio where currently supported;
- save/persist;
- word appears in custom/my-words child category;
- edit/delete behavior;
- reload/relaunch persistence;
- failure/permission states.

## Recording/native flows

Real native validation is required where functionality depends on:

- microphone permission;
- audio recording;
- image picker/camera/photo library;
- file/backup APIs.

Web mocks do not count as full native attestation.

## Keyboard testing

At minimum test landscape phone with software keyboard open on:

- custom word text input;
- settings/form input if present;
- any report/filter field if present.

The focused field and primary save/action must remain reachable.

## Tests

Cover:

- rewards star/sticker state and navigation;
- parent gate success/cancel/failure paths;
- every Parent Center tab;
- custom word CRUD and child-category propagation;
- recording playback/capture;
- backup/restore compatibility where supported;
- settings persistence;
- report rendering;
- keyboard/safe-area behavior;
- compact phone and tablet screenshots;
- native permissions explicitly reported.

## Acceptance criteria

- [ ] Rewards is landscape-complete with state/persistence parity.
- [ ] Parent Gate is landscape-complete and remains guarded.
- [ ] Every current Parent Center tab/feature is reachable.
- [ ] Custom word CRUD works end-to-end and propagates to child vocabulary.
- [ ] Recording/image/backup flows preserve current behavior.
- [ ] Landscape software keyboard does not hide critical form controls.
- [ ] RTL/safe areas are correct.
- [ ] Native-only coverage is explicitly evidenced or marked BLOCKED.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-27-report.md` exists.

## Exit condition

End with exactly one of:

`REWARDS AND PARENT READY FOR PHASE 28`

or

`BLOCKED`

Then stop.
