# Phase 14 side-by-side comparison

Compared: Expo web screenshots from phases 7–13 and `full-sweep` versus
`docs/migration/screenshots/legacy-baseline/` at the same viewport names.

Both apps were **not** installed on the same physical device. There is no
`com.yonicks.talki` + `com.yonicks.talki.dev` pair on hardware in this
sandbox. Classification below is from the committed screenshot sets and
the running web app.

An unclassified difference is a FAIL. INTENDED rows cite the deviation
record.

## Home

| Viewport | Class | Notes |
|---|---|---|
| iphone-13, android-compact, ipad-mini | INTENDED | Native Home follows the approved mock (hero, four sections, three-tab bar). Record: phase-07-plan.md / `docs/design/talki-home-approved.png`. Legacy baseline home already shows the same Talki shell; remaining differences are progress numbers and hero art crop, not missing behaviour. |
| landscape-844 / 932 | INTENDED | Native is responsive; legacy locked portrait (phase-04-plan.md). |

## Category word grid

| Class | Notes |
|---|---|
| INTENDED | Same tiles (art + word + speaker + star when learned). Native uses design-system cards rather than legacy `.tile` CSS. No behaviour lost on web. |
| DEFECT | `celebrate()` overlay is missing on the 10th learned word from this path (D13). |

## Cards / games menu / practice menu

| Screen | Class | Notes |
|---|---|---|
| Cards | INTENDED | Same prev/next/say/counter. Landscape on native (phase-04). |
| Games menu | INTENDED | Illustrated game cards (phase-07 assets). Chip row instead of any `<select>`. |
| Practice menu | INTENDED | Six modes, same titles. |

## Games

| Screen | Class | Notes |
|---|---|---|
| Quiz, memory, missing, match, count, sounds, sort, bubbles | INTENDED / IMPROVED | Boards match the legacy interaction. Native shares `GameShell` + done-card star tiers. Web screenshots exist per phase 8–10. Device drag/audio not compared. |
| Puzzle | DEFECT (unverified native) | Web board exists. Device drag + landscape + `puzzleLevel` not compared on hardware. |
| Speech | DEFECT | Web shows the unsupported banner. Legacy uses the browser SpeechRecognition API. Device he-IL path not compared. |

## Practice

| Screen | Class | Notes |
|---|---|---|
| Focus, cloze, receptive, pairs, combine | INTENDED | Same prompts and once-on-entry speech (speechSpy). |
| Temptation | DEFECT (unverified native) | Jar board renders. Any-sound open not compared on a device mic. |

## Stickers / rewards

| Class | Notes |
|---|---|
| DEFECT | Unlock rules, filters, counter, and greyed-locked tiles match. Art is emoji tiles, not `talki-sticker-*.png`. That is worse than legacy, not a recorded deviation. |

## Parent

| Screen | Class | Notes |
|---|---|---|
| Gate | INTENDED | Full-screen keypad (not the Phase 5 gallery modal). Same 900 ms hold + a×b. |
| Settings / report / method | INTENDED | Same controls; privacy URL unchanged. |
| Record / words | DEFECT | Tabs exist; photo pick is a stub; device recording not compared. Storage engine/quota line is missing. |

## Intro

| Class | Notes |
|---|---|
| INTENDED | Animated Yonicks sequence. Record: phase-06-plan.md. |

## Ads / chrome

| Class | Notes |
|---|---|
| INTENDED | Reservation exists; no ad element on web. Record: phase-13-plan.md. |
| DEFECT | Recorded ads library (`react-native-google-mobile-ads`) was never installed. Live banner not compared. |
| INTENDED | Status bar cream `#FFF8EA` vs splash `#FFF6E4` (D2 / phase-13). |

## Device captures

`docs/migration/screenshots/phase-14/device-<model>-<screen>.png` — **none**.
`docs/migration/screenshots/phase-14/comparison/<screen>-native-vs-legacy.png`
— **none** (no dual-install device). Web captures live under
`docs/migration/screenshots/phase-14/<viewport>-<screen>.png` after
full-sweep.
