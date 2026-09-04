# Phase 27 report — Landscape Rewards and Parent Center

## Summary

Phase 27 migrates Rewards/Stickers and the full Parent Gate + Parent Center
to landscape. Stickers use shared `LandscapeWorldShell` with token-paged
sticker cells (no tall portrait wrap). Parent surfaces use a new adult
`ParentShell` (`LandscapeScreen` + `KeyboardAvoidingView`, no toddler world
background): landscape gate (prompt | keypad), horizontal tab strip, and
scrollable adult forms. Reward economics, gate maths, settings/backup/
recording/custom-word schemas, and progress stores are unchanged. Capacitor
untouched. Phase 28 not started.

## Pre-flight inventory (recorded before edits)

- **Rewards:** `StickersScreen` / `StickerGrid` / `StickerFilters` + domain
  stickers/filters/art; already on `LandscapeWorldShell` but vertical
  ScrollView + hardcoded 72×72 cells.
- **Parent:** `ParentScreen` + `ParentGateScreen` + 5 tabs (`Settings`,
  `Record`, `Words`, `Report`, `Method`) + `BackupPanel` / `PhotoPicker` /
  `RecordButton` / `CustomWordForm`; still on `TalkiScreen`.
- **Reusable seams:** `LandscapeWorldShell`, `LandscapeTopBar`,
  `LandscapePageIndicator`, `landscapeTokens`, `wordGridPages`,
  `useLandscapeLayout`, `useParentLock`, `gateReducer`.
- **Expected edits:** tokens (sticker/parent), StickersScreen paging,
  ParentShell, gate/center layout, tab keyboard scroll, e2e + unit tests,
  phase-27 screenshots/report.
- **Assets:** sticker art + home world BG EXISTING; no dedicated parent
  mock (adult density — not DESIGN-BLOCKED).
- **Behavior to preserve:** unlock rules, 24-sticker catalog, gate a×b,
  re-lock on blur, settings persistence, backup v1, custom CRUD → `mine`,
  recording service contracts.
- **Validation:** tsc, eslint, vitest, expo export, Playwright stickers +
  parent × 8 viewports; native device attestation if available else
  honest BLOCKED.

## Gate

Phase 26 report ends with `CHILD FEATURE COMPLETION GATE PASSED` — confirmed.

## Feature inventory

| Surface | Implementation | Landscape treatment |
|---|---|---|
| Rewards / stickers | `StickersScreen` + grid/filters | World shell, token cell size, paged catalog |
| Parent gate | `ParentGateScreen` + `gateReducer` | ParentShell; prompt \| keypad row |
| Settings | `SettingsTab` + `BackupPanel` | Scroll + keyboard persist taps |
| Record | `RecordTab` + `RecordButton` | Same; category chips + word list |
| Words | `WordsTab` + `CustomWordForm` + `PhotoPicker` | Compact form row; tablet split form\|list |
| Report | `ReportTab` | Scroll category progress + hardest |
| Method | `MethodTab` | Scroll method cards |

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| Rewards landscape-complete with state/persistence parity | PASS | Token-paged stickers; counter/unlock e2e; vitest stickers; domain untouched |
| Parent Gate landscape-complete and guarded | PASS | Hold → gate; wrong stays locked; leave re-locks; ParentShell layout |
| Every Parent Center tab/feature reachable | PASS | settings/record/words/report/method e2e + screenshots × 8 viewports |
| Custom word CRUD end-to-end + child vocabulary | PASS | Create → list → `mine` category word tile → delete; unit custom-words |
| Recording/image/backup preserve current behavior | PASS (web) / BLOCKED (native device) | Web backup merge stub + unit round-trip; native mic/picker/share not device-attested |
| Landscape software keyboard does not hide critical controls | PASS (scroll reachability) / BLOCKED (native OSK) | Save scrollIntoView + in-viewport assert; ParentShell KeyboardAvoidingView; no real OSK on Playwright Chrome |
| RTL / safe areas correct | PASS | LandscapeScreen RTL dir; ParentShell/WorldShell safe areas |
| Native-only coverage evidenced or marked BLOCKED | PASS (honesty) | Native rows BLOCKED below — no device in unattended run |
| Full relevant regression | PASS | tsc/eslint/vitest/expo export/Playwright 32/32 |
| `docs/migration/phase-27-report.md` exists | PASS | This file |

## Custom-word end-to-end evidence

Playwright `parent.spec.ts` — `custom word CRUD persists and appears in mine category` (8/8 viewports):

1. Hold parent brand → unlock gate.
2. Words tab → fill `סבתא רותי` → scroll save into view → save.
3. Item appears under `parent-words-item-*`.
4. Back to Home → open `home-category-mine` → `category-word-0` contains text.
5. Re-enter parent → delete → empty state copy.

Unit: `custom-words.test.ts` CRUD / mine / photo / game start still green.

Photo: form + `photoService` accept JPEG data URLs; e2e did not inject
`__talkiCustomPhoto` this run (text-only path). Native library/camera
permission flow not device-attested.

## Native permissions / recording / image / backup status

| Capability | Code path | This run |
|---|---|---|
| Microphone recording | `expoRecording.ts` (native) / `webRecording.ts` (web) | **BLOCKED** — no iOS/Android device; Record tab UI reachable on web |
| Image picker / camera | `photoService` + `expo-image-picker` | **BLOCKED** — no device permission grant |
| Backup export/import file APIs | `shareBackup.ts` is DOM download/file input (web); payload via `BackupService` | Web e2e merge stub **PASS**; native share/pick **BLOCKED** (DOM helpers no-op off-web) |
| Maestro parent gate smoke | `.maestro/parent.yaml` | **BLOCKED** — no attached device |

Do not treat web MediaRecorder / file-input stubs as native attestation.

## Keyboard results

- ParentShell wraps content in `KeyboardAvoidingView` (iOS padding).
- All Parent Center tabs use `ScrollView` + `keyboardShouldPersistTaps="handled"`.
- Words form: word + emoji on one row; save after photo; e2e asserts save is
  scroll-reachable and in-viewport after `scrollIntoViewIfNeeded`.
- Playwright desktop Chrome has no software OSK — native landscape OSK
  occlusion QA remains a Phase 28 / device risk.

## Screenshot index

Under `docs/migration/screenshots/phase-27/` (96 PNGs = 12 names × 8 viewports):

| Name | Surfaces |
|---|---|
| `stickers-all` / `stickers-filtered` / `stickers-progressed` | Rewards |
| `parent-gate` | Gate |
| `parent-settings` / `parent-reset-confirm` | Settings |
| `parent-record` | Record |
| `parent-words` / `parent-words-created` | Words |
| `parent-report` | Report |
| `parent-method` | Method |
| `mine-custom-word` | Child mine category after create |

### Compact phone

`667x375-*` and `740x360-*` captured for all names above.

### Modern / large phone

`844x390-*` and `932x430-*` captured.

### Tablet

`1024x768-*`, `1133x744-*`, `1280x800-*`, `1366x1024-*` captured.

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint src/features/rewards src/features/parent \
    src/design-system/landscape/tokens.ts \
    tests/unit/landscape-shell.test.ts \
    tests/e2e/stickers.spec.ts tests/e2e/parent.spec.ts
  # exit 0
$ npx vitest run                   # 51 files / 5541 tests PASS
$ npx expo export --platform web   # exit 0
$ npx playwright test \
    tests/e2e/stickers.spec.ts tests/e2e/parent.spec.ts \
    --workers=1 \
    --project=compact-phone --project=compact-android-phone \
    --project=landscape-844 --project=landscape-932
  # 16 passed (~1.0m)
$ npx playwright test \
    tests/e2e/stickers.spec.ts tests/e2e/parent.spec.ts \
    --workers=1 \
    --project=tablet-4-3 --project=tablet-1133 \
    --project=tablet-16-10 --project=large-tablet
  # 16 passed (~1.1m)
  # Combined: 32/32 green across 8 landscape viewports.
```

Generated asset / theme snapshot noise from export tooling was reverted
(`audio.generated.ts`, `v2.generated.ts`, `words.generated.ts`,
`theme.test.ts.snap`).

## Files changed

- `apps/mobile/src/design-system/landscape/tokens.ts` — Phase 27 sticker +
  parent gate/content tokens.
- `apps/mobile/src/features/rewards/StickersScreen.tsx` — paged landscape
  rewards composition + back accessory.
- `apps/mobile/src/features/rewards/StickerGrid.tsx` — token cell sizes +
  page `baseIndex` testIDs.
- `apps/mobile/src/features/rewards/StickerFilters.tsx` — token gaps.
- `apps/mobile/src/features/parent/ParentShell.tsx` — new adult landscape shell.
- `apps/mobile/src/features/parent/ParentGateScreen.tsx` — landscape gate.
- `apps/mobile/src/features/parent/ParentScreen.tsx` — ParentShell + horizontal tabs.
- `apps/mobile/src/features/parent/components/CustomWordForm.tsx` — denser landscape form.
- `apps/mobile/src/features/parent/tabs/*` — keyboard-safe ScrollViews; Words split on tablet.
- `apps/mobile/src/testing/testIds.ts` — stickers page/back ids.
- `apps/mobile/tests/unit/landscape-shell.test.ts` — Phase 27 token contract.
- `apps/mobile/tests/e2e/stickers.spec.ts` / `parent.spec.ts` — Phase 27 + custom-word e2e.
- `docs/migration/screenshots/phase-27/*` — evidence matrix.
- `docs/migration/CURSOR-RUN-LOG.md` — this phase.

## Deviations / blockers

- No dedicated Rewards/Parent landscape reference crops in
  `docs/design/landscape/reference/` — visuals inherit home world (rewards)
  and adult Talki density (parent); not treated as DESIGN-BLOCKED.
- Native mic / image-picker / backup-share / Maestro: **BLOCKED** (no device).
- Native landscape software-keyboard occlusion: **BLOCKED** (web OSK absent).
- `shareBackup.ts` remains web DOM-only (pre-existing); not expanded this phase.

## Phase 28 risks

1. Device QA for recording precedence over TTS, image picker permissions,
   and native backup share/pick.
2. Real landscape OSK on iOS/Android parent forms (Words/Settings).
3. Global polish (splash/intro/toast/ad/a11y) still Phase 28 — not started.
4. Expo web raster paint of home world behind stickers may differ slightly
   from native.

## Explicit phase status

REWARDS AND PARENT READY FOR PHASE 28
