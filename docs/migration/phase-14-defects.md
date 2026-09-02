# Phase 14 defects

Severity:

- **BLOCKER** — must fix before cutover
- **MAJOR** — should fix before cutover
- **MINOR** — can ship, fix after
- **DEFERRED** — deliberate deviation, with its record

Only BLOCKERs may be fixed in this phase. None of the BLOCKERs below can
be fixed from this sandbox (they need hardware, store credentials, or a
product art pass). They are logged, not quietly resolved.

## BLOCKER

| Id | Defect | Evidence |
|---|---|---|
| P14-B1 | No named device in the required matrix (low-end / mid / recent Android, Android tablet, iPhone, iPad) | phase-14-device-qa.md |
| P14-B2 | 30-minute memory soak not run; Hermes + Reanimated risk unmeasured | phase-14-performance.md |
| P14-B3 | Speech recognition (`he-IL`, Levenshtein ≤ 1) not attested on a device | speech.spec.ts web-unsupported only |
| P14-B4 | Parent recording (4 s cap, file on disk, say() prefers rec) not attested on a device | Photo/mic APIs stubbed or untested on hardware |
| P14-B5 | AdMob banner not installed / not attested; recorded library missing | `react-native-google-mobile-ads` absent; phase-13-report.md |
| P14-B6 | Cold start, transition, fps, battery not measured on two device classes | phase-14-performance.md |
| P14-B7 | Offline-after-first-load not attested; Expo web has no `sw.js` | checklist §13 |
| P14-B8 | Maestro `full-regression.yaml` not executed | no Maestro binary |

## MAJOR

| Id | Defect | Evidence |
|---|---|---|
| P14-M1 | Sticker art is emoji tiles, not the 24 PNGs | stickers screen vs `talki-sticker-*.png` |
| P14-M2 | `PhotoService.pick` is a stub; no 320×320 JPEG | WordsTab |
| P14-M3 | Storage engine name and quota not shown in parent settings | SettingsTab |
| P14-M4 | `?game=` cold-start deep link not wired | phase-07-report.md; parseGameDeepLink unit-only |
| P14-M5 | Unknown-route fallback is not Home | Expo Router vs `views[view]` 2109 |
| P14-M6 | `celebrate()` missing on category word-tile path (D13) | WordTile / stars.ts |
| P14-M7 | `NEVER_COMBINE` still not enforced (D10) | audioPolicy.shouldPlaySfx |
| P14-M8 | Wake lock not ported (D4) | no expo-keep-awake |
| P14-M9 | Native splash 1400 ms / `expo-splash-screen` not installed | app.config extra only |
| P14-M10 | Hardware back / process-kill SQLite durability not attested; web extra `goBack` from Home left the app on every viewport (`PHASE14_CHILD_SIM_EXTRA_BACK=left-app`) | validation.md §4; full-sweep child-sim |
| P14-M11 | Screen-reader labels not proven on every interactive element | code has many labels; no TalkBack/VoiceOver pass |
| P14-M12 | Reduce-motion only honoured on the intro sequence | IntroSequence comment; games still animate |
| P14-M13 | Colour contrast not measured | no WCAG audit |
| P14-M14 | `START_GAME_TOAST` still says “at least 4 words” for MIN_ITEMS 1–2 (D7) | startGame.ts |
| P14-M15 | Real AdMob unit id still the Google sample (D3) | adConfig.ts |
| P14-M16 | Expo Router tabs keep Home mounted; full-page audits can see two `parent-button`s | phase-12-report.md |

## MINOR

| Id | Defect | Evidence |
|---|---|---|
| P14-m1 | Speech-unsupported banner not shown on Home when recognition is missing | phase-07-report.md |
| P14-m2 | Status bar `#FFF8EA` vs splash `#FFF6E4` | D2 / phase-13; do not unify |
| P14-m3 | Count game in **legacy** still writes no progress (D8); native already calls `markLearned` | CountScreen.tsx |
| P14-m4 | Unmapped music files 02/03/04 stay unmapped | recorded decision, section 9 |

## DEFERRED (recorded deviations)

| Id | Item | Record |
|---|---|---|
| P14-D1 | Games/practice landscape; other routes responsive | phase-04-plan.md |
| P14-D2 | Animated opening sequence | phase-06-plan.md |
| P14-D3 | Recordings as files, data URL only at export | phase-03-plan.md |
| P14-D4 | Home layout vs approved mock | phase-07-plan.md |
| P14-D5 | Ads library swap (intended, but the package was never added — see P14-B5) | phase-13-plan.md |

## Child / toddler simulation (web)

Performed in `full-sweep.spec.ts`:

- Eight-tap burst on a category card, six-tap burst on a word tile.
- Enter quiz, rotate the viewport mid-game, rotate back.
- Four rapid `goBack`s; app stays on Home with the tab bar.
- `visibilitychange` / `pagehide` / `pageshow`; Home still visible.

Not performed: a real toddler, tapping a live ad, force-stop, device
rotation with an orientation lock, or background audio.

## BLOCKER fixes in this phase

None. The BLOCKERs require hardware, store config, or art that this
sandbox cannot supply. The prompt forbids quietly resolving them without
review and forbids building new features.
