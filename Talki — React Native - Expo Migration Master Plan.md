# Talki — React Native / Expo Migration Master Plan

> **This document is the strategy. It is not how the migration is executed.**
>
> Execution lives in [docs/migration/](docs/migration/README.md), which holds
> three documents per phase: a design plan for a human reviewer, a paste-ready
> agent prompt, and a report the agent writes as evidence.
>
> - [docs/migration/README.md](docs/migration/README.md) — index and how to run a phase
> - [docs/migration/validation.md](docs/migration/validation.md) — the gate every phase must pass
> - [docs/migration/feature-parity-checklist.md](docs/migration/feature-parity-checklist.md) — the verified inventory, graded at Phase 14
>
> The `CLAUDE / CURSOR PROMPT` blocks kept in this document below are the
> original sketches. The authoritative prompts are the ones under
> `docs/migration/prompts/`, which carry the verified constants, the test
> requirements and the screenshot manifests. Use those.
>
> Sections 2, 6 and 9 were corrected on 2026-09-01 against a direct audit of
> `index.html` at commit `edbe634`. See section 14 for the full list of what
> changed and why.

## 1. Objective

Migrate Talki from the existing:

```text
Vanilla JavaScript
+ single index.html
+ IndexedDB
+ Web Speech APIs
+ Capacitor
+ PWA
```

to:

```text
React Native
+ Expo
+ TypeScript
+ native navigation
+ native audio / recording
+ native local persistence
+ native orientation
+ native animations
+ Android + iOS
```

without throwing away the working product logic or trying to rewrite everything at once.

The migration is **parallel**, not destructive.

The current app remains working until the React Native app reaches full functional parity.

---

# 2. Current Talki Architecture — Source of Truth

Current production structure is approximately:

```text
talki/
├── index.html
│   ├── HTML
│   ├── ~all CSS
│   ├── vocabulary data
│   ├── application state
│   ├── navigation
│   ├── game logic
│   ├── speech-practice logic
│   └── rendering / event handlers
│
├── audio-manager.js
├── assets/
│   ├── words/
│   ├── v2/
│   └── audio/
│
├── assets/audio/audio-logic.js
│
├── tests/
│   ├── audio-logic.test.js
│   ├── interaction_suite.py
│   ├── test_suite.py
│   └── word-speak-playwright.mjs
│
├── docs/
├── tools/
├── android/              ← Capacitor
├── ios/                  ← Capacitor
├── capacitor.config.ts
├── manifest.json
└── package.json
```

Important existing concepts that must survive migration:

### Vocabulary

10 built-in categories plus `mine`.

182 built-in words.

Current category model:

```ts
{
  id,
  title,
  icon,
  cls,
  items: [
    {
      word,
      emoji,
      img,
      sound?
    }
  ]
}
```

### Progress

Currently:

```text
points = learned.size
```

Progress is not a fake score system.

A learned item is keyed using:

```text
categoryId:word
```

Continue Learning is currently calculated by `currentCategory()`
(index.html 2206-2216) using **four** steps, in this order:

1. if `lastCat` is set and that category is not fully learned, return it
2. otherwise the highest-completion-ratio partially learned category
3. otherwise the first untouched category
4. otherwise `cats[0]`

`lastCat` is persisted only by `enterCat()` (index.html 1823), which fires when
a child explicitly opens a category. It is deliberately not written by
`startGame()`'s category fallback.

Preserve that behavior initially, including step 1.

### Persistent state

There are exactly **seven** key patterns, defined by `K` at index.html
1633-1637:

```text
lia:progress
lia:settings
lia:stats

lia:custom:index
lia:custom:<id>

lia:rec:<category:word>

lia:lastcat
```

`lia:lastcat` is easy to miss and drives step 1 of Continue Learning. Do not
drop it.

Storage backends are tried in order (index.html 1662-1745): IndexedDB
(`lia-words` / store `kv` / version 1), then `window.storage`, then an
in-memory `Map`. There is no `localStorage` usage.

`lia:rec:*` values are **audio data URL strings**, not file paths.

Settings defaults are (index.html 1647):

```ts
{
  rate: 0.85,
  niqqud: true,
  sounds: true,
  effects: true,
  music: true,
  musicVol: 0.5,
  voice: true
}
```

Two further settings keys are written at runtime and are absent from the
defaults literal. Both must survive a backup round trip:

```ts
{
  lastBackup,   // ISO string, set by exportBackup()  (index.html 1771)
  puzzleLevel   // 1..5, adaptive puzzle difficulty   (index.html 2973-2978)
}
```

### Backup contract

Current backups use (`exportBackup()`, index.html 1754-1775):

```ts
{
  app: "talki",
  version: 1,
  exported_at: "...",   // ISO
  word_count: ...,      // equals learned.size
  data: {...}           // every Store key, verbatim
}
```

This is extremely useful.

React Native should remain able to import **Talki backup version 1**.

Three details of `importBackup()` (index.html 1777-1799) that are easy to get
wrong:

- The signature check accepts **two** app names:
  `payload.app === 'talki' || payload.app === 'lia-words'`. `lia-words` is the
  product's former name and real user backups carry it. Rejecting it would
  break exactly the users this contract exists to protect.
- There are two modes. `replace` deletes every existing key first. `merge`
  unions the `lia:progress` array via a `Set` and overwrites every other key.
- A malformed or non-Talki file must toast and return, never throw.

### Current main screens/features

Current executable `index.html` contains routes/views including:

```text
home
category
cards

games
practice
stickers

quiz
memory
missing
match
speech
bubbles
sounds
count
sort
puzzle

focus
cloze
temptation
receptive
pairs
combine

parent
```

That is 23 view identifiers, driven by `let view` (index.html 1650) and the
`views` map inside `render()` (2085-2092). There is no router library.

Of those, 11 are games — `quiz`, `memory`, `missing`, `match`, `cards`,
`sounds`, `count`, `sort`, `bubbles`, `puzzle`, `speech` — and 6 are
speech-practice modes declared in `PRACTICE_LIST` (2218-2225).

Never rely only on an old design/audit document for this list.

Always rescan current `index.html`.

The verified inventory, with per-item line references, is maintained at
[docs/migration/feature-parity-checklist.md](docs/migration/feature-parity-checklist.md).

---

# 3. Migration Principle

We will NOT do:

```text
index.html
   ↓
massive rewrite
   ↓
hope everything works
```

We will do:

```text
Legacy Talki
      │
      │ remains working
      ▼

Build RN foundation
      │
      ▼
Port domain/data
      │
      ▼
Port one full vertical slice
      │
      ▼
Port games progressively
      │
      ▼
Port parent/speech features
      │
      ▼
Parity test
      │
      ▼
Native release
      │
      ▼
Retire Capacitor
```

---

# 4. Repository Strategy

Do NOT immediately move the current app into `apps/web`.

That creates unnecessary risk.

Instead:

```text
talki/
│
├── index.html                 ← legacy app remains untouched
├── audio-manager.js
├── assets/                    ← canonical Talki assets
├── tools/
├── tests/
├── android/                   ← legacy Capacitor
├── ios/                       ← legacy Capacitor
│
├── apps/
│   └── mobile/
│       ├── app/
│       ├── src/
│       ├── tests/
│       ├── app.config.ts
│       ├── eas.json
│       └── package.json
│
└── docs/
    └── migration/
```

Eventually:

```text
legacy root app
```

can be archived or removed.

But **not during the migration**.

---

# 5. Target React Native Architecture

```text
apps/mobile/
│
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│
│   ├── home/
│   ├── category/
│   │   └── [categoryId].tsx
│
│   ├── games/
│   │   ├── quiz.tsx
│   │   ├── memory.tsx
│   │   ├── missing.tsx
│   │   ├── matching.tsx
│   │   ├── cards.tsx
│   │   ├── bubbles.tsx
│   │   ├── sounds.tsx
│   │   ├── count.tsx
│   │   ├── sort.tsx
│   │   ├── puzzle.tsx
│   │   └── speech.tsx
│
│   ├── practice/
│   │   ├── focus.tsx
│   │   ├── receptive.tsx
│   │   ├── cloze.tsx
│   │   ├── temptation.tsx
│   │   ├── pairs.tsx
│   │   └── combine.tsx
│
│   ├── rewards/
│   └── parent/
│
├── src/
│   │
│   ├── design-system/
│   │   ├── theme/
│   │   ├── components/
│   │   ├── typography/
│   │   └── responsive/
│   │
│   ├── domain/
│   │   ├── vocabulary/
│   │   ├── progress/
│   │   ├── games/
│   │   ├── practice/
│   │   └── backup/
│   │
│   ├── data/
│   │   ├── categories.ts
│   │   ├── practiceModes.ts
│   │   ├── games.ts
│   │   └── achievements.ts
│   │
│   ├── state/
│   │
│   ├── services/
│   │   ├── storage/
│   │   ├── audio/
│   │   ├── speech/
│   │   ├── recording/
│   │   ├── orientation/
│   │   ├── backup/
│   │   └── ads/
│   │
│   ├── components/
│   └── features/
│
└── tests/
```

---

# 6. Technology Decisions

## Framework

```text
Expo SDK 57      (pin >= 57.0.17)
React Native 0.86.3
React 19.2.3
Node >= 22.13
TypeScript strict
```

The `>= 57.0.17` floor is not cosmetic. Earlier SDK 57 releases inherit two
Hermes v1 regressions from SDK 56: a large memory increase in any app importing
`react-native-reanimated` or `react-native-worklets`, fixed in 57.0.9, and a
development startup-time regression fixed in 57.0.17. Talki uses Reanimated
heavily, so both apply.

## Navigation

Use:

```text
Expo Router
```

Do not recreate:

```js
view = 'memory'
render();
```

Routes become real screens.

## State

Use:

```text
Zustand
```

only for meaningful cross-app state:

```text
settings
learned words
stats
custom words
points
current user progress
```

Game session state should normally remain local to each feature using hooks/reducers.

Do NOT put every temporary card flip or bubble position in the global store.

## Storage

Use:

```text
expo-sqlite
expo-sqlite/kv-store
```

Initially preserve the current logical storage model.

That gives us a very low-risk migration from IndexedDB semantics while still using native persisted storage.

## Audio

Use:

```text
expo-audio
```

for:

```text
music
SFX
parent recordings
audio-session control
```

Expo Audio supports both playback and recording natively.

Keep the existing semantic audio model:

```text
ui.primaryTap
answer.correct
answer.retry
reward.star
interaction.correctMatch
speech.listeningReady
...
```

The existing DOM-free:

```text
assets/audio/audio-logic.js
```

should be ported almost directly to TypeScript.

## TTS

Use:

```text
expo-speech
```

behind:

```ts
SpeechService
```

Never call Expo Speech directly from screens.

Long term the resolver should be:

```text
Parent recording
      ↓
Bundled Talki voice recording
      ↓
System Hebrew TTS
```

That lets us gradually replace robotic/system TTS with consistent Talki voice recordings without touching game code.

## Recording

Use:

```text
expo-audio
```

and preserve the existing recording override model.

## Orientation

Use:

```text
Expo Router screen orientation
+
expo-screen-orientation
```

Expo currently supports per-screen orientation directly through Router stack options.

**This is a deliberate deviation from parity, not a port.** The legacy app is
hard-locked to portrait in two places: `screen.orientation.lock('portrait')`
(index.html 4088) and `"orientation": "portrait"` in `manifest.json`. Landscape
games are a product upgrade the migration is taking the opportunity to make.
It is recorded as such in
[docs/migration/feature-parity-checklist.md](docs/migration/feature-parity-checklist.md)
section 14, so Phase 14 does not grade it as a regression.

Define the decision centrally:

```ts
orientationPolicy = {
  intro: 'responsive',
  home: 'responsive',
  category: 'responsive',

  games: 'landscape',
  practice: 'landscape'
}
```

Do not scatter orientation calls throughout game components.

For iPad, configure full-screen behavior correctly because iPad multitasking affects orientation locks.

## Animations

Use:

```text
react-native-reanimated
react-native-gesture-handler
```

for:

```text
card flip
drag/drop
swipe
bubble movement
game transitions
Yonicks Studios intro
reward animations
```

## Images

Prefer:

```text
expo-image
```

for Talki artwork.

## Ads

Eventually replace:

```text
@capacitor-community/admob
```

with:

```text
react-native-google-mobile-ads
```

This contains native code, so the project should use an Expo development build rather than depending on Expo Go.

---

# 7. Important Architectural Rule — Asset Registry

Today Talki can do:

```js
img: 'assets/words/animals/talki-animals-dog.png'
```

React Native cannot safely depend on arbitrary dynamic `require(path)` calls.

Create a generated asset registry:

```ts
export const wordAssets = {
  'animals/dog':
    require('../../../../assets/words/animals/talki-animals-dog.png'),

  'animals/cat':
    require('../../../../assets/words/animals/talki-animals-cat.png'),

  ...
};
```

Do NOT manually maintain 182 mappings.

Create:

```text
tools/generate-mobile-asset-registry.mjs
```

The script scans:

```text
assets/words/
assets/v2/
assets/audio/
```

and generates typed registries.

Generation must be deterministic.

---

# 8. Functional Sources of Truth

During migration use this priority:

```text
1. Current executable index.html
2. Current tests
3. Current assets/data
4. README
5. docs/* audits/plans
6. old screenshots
```

For visuals:

```text
1. newly approved landscape mock
2. docs/design/talki-home-approved.png
3. current implementation
```

Do not blindly recreate legacy CSS.

The whole point of the migration is to implement the **approved design directly in native UI**.

---

# 9. Migration Quality Rules

The enforceable version of this section is
[docs/migration/validation.md](docs/migration/validation.md). It is the
contract; what follows is the summary.

Validation runs in three tiers, because no single tool covers a React Native
app:

```text
Tier 1   vitest + differential tests vs the legacy JS   logic, no rendering
Tier 2   Playwright against the Expo web target          layout, RTL, interaction, screenshots
Tier 3   Maestro + real device + manual attestation      native-only truth
```

Tier 2 works because Expo builds the same app for web through
`react-native-web`, and `testID` renders as `data-testid`. The web target
exists **only** so the app is drivable by Playwright. It is never shipped, and
no design decision may be made for its benefit.

Tier 1 leans on differential testing rather than hand-written expectations. The
whole risk in a migration is that the author's belief about the old behaviour
is wrong, so the new implementation is compared directly against the old code:
`assets/audio/audio-logic.js` is DOM-free CommonJS and can be `require()`d
beside its TypeScript port, and `CATEGORIES` is extracted from `index.html`
into a fixture that the port must deep-equal.

Tier 3 covers what a browser provably cannot: real audio playback and ducking,
Hebrew TTS availability, microphone permission, orientation locks, SQLite
durability across a process kill, AdMob, background and resume, and cold start
offline. Phase reports must name the device and OS version.

Every phase must satisfy all seven gate items before it is reported complete:

```text
1  tsc --noEmit, eslint and expo-doctor clean
2  vitest run green, including differential tests
3  expo export --platform web succeeds
4  playwright test green across all ten viewport projects
5  screenshots committed under docs/migration/screenshots/phase-NN/
6  legacy Talki still green: both Python suites plus audio-logic unit tests
7  docs/migration/phase-NN-report.md written, PASS or FAIL per item
```

The ten viewport projects are the eight from `tests/interaction_suite.py`, so
results stay comparable with legacy, plus two landscape tablet sizes because
games are now landscape:

```text
320x568   360x800   390x844   430x932
768x1024  834x1112  844x390   932x430
1024x768  1280x800
```

Visual phases must additionally verify RTL, safe areas and a minimum 48x48
touch target on every child-facing control.

---

# 10. PHASES

# PHASE 0 — Freeze and Audit the Migration Baseline

> Plan: [phase-00-plan.md](docs/migration/phases/phase-00-plan.md) · Prompt: [phase-00.md](docs/migration/prompts/phase-00.md)

## Goal

Create a definitive migration baseline before writing React Native code.

## Work

Re-audit current master.

Capture:

```text
all views
all games
all practice modes
all storage keys
all settings
all categories
all word counts
all achievements
all audio events
all backup fields
all current tests
all Capacitor-native behavior
```

Do not rely exclusively on:

```text
docs/talki-home-redesign-audit.md
```

because the live code has already evolved beyond parts of that document.

Create:

```text
docs/migration/00-current-state.md
docs/migration/feature-parity-checklist.md
```

Tag/reference the current legacy revision.

Run the existing legacy test suites.

## Exit criteria

We know exactly what “feature parity” means.

No application behavior changes.

## CLAUDE / CURSOR PROMPT — PHASE 0

```text
We are beginning the Talki migration from the existing vanilla-JS/Capacitor app to a new Expo React Native application.

Execute ONLY Phase 0.

IMPORTANT:
- Do not modify product behavior.
- Do not start the Expo application yet.
- Do not trust old audit documents more than current executable code.
- index.html on the current branch is the primary functional source of truth.

Inspect:
- index.html
- audio-manager.js
- assets/audio/audio-logic.js
- README.md
- package.json
- capacitor.config.ts
- manifest.json
- tests/**
- docs/**
- tools/**

Create:

docs/migration/00-current-state.md
docs/migration/feature-parity-checklist.md

Document at minimum:

1. every current view/screen
2. every game
3. every speech-practice mode
4. every category and exact built-in word count
5. custom-word model
6. progress/points semantics
7. Continue Learning algorithm
8. persistent keys and data shapes
9. settings
10. recording behavior
11. TTS behavior
12. speech-recognition behavior
13. audio music/SFX behavior
14. rewards/stickers/achievements
15. parent gate and parent tools
16. backup version and schema
17. PWA/offline behavior
18. Capacitor/native behavior
19. AdMob behavior
20. existing tests and CI
21. all known browser/platform fallbacks

Compare docs/talki-home-redesign-audit.md against the current source and explicitly record anything that is stale.

Run the current legacy tests and document their results.

Do not continue to Phase 1.

At the end report:
- files inspected
- feature count
- game count
- practice-mode count
- test status
- inconsistencies found in existing docs
- migration risks
```

---

# PHASE 1 — Create the Expo / React Native Application

> Plan: [phase-01-plan.md](docs/migration/phases/phase-01-plan.md) · Prompt: [phase-01.md](docs/migration/prompts/phase-01.md)

## Goal

Add the new native application without touching the legacy product.

## Work

Create:

```text
apps/mobile/
```

using Expo SDK 57.

Configure:

```text
Expo Router
TypeScript strict
ESLint
development build
Android
iOS
safe-area context
React Native Gesture Handler
Reanimated
```

Add root npm workspace support without breaking current root scripts.

Recommended root scripts:

```json
{
  "mobile:start": "...",
  "mobile:android": "...",
  "mobile:ios": "...",
  "mobile:typecheck": "...",
  "mobile:test": "...",
  "mobile:lint": "..."
}
```

Use separate development IDs:

```text
com.yonicks.talki.dev
```

and preserve production:

```text
com.yonicks.talki
```

for eventual release.

Initial screen:

```text
Talki Native Migration
Phase 1
```

Nothing more.

## Exit criteria

```text
legacy still works
Expo app boots
Android dev build works
TypeScript strict passes
Expo Doctor passes
```

## CLAUDE / CURSOR PROMPT — PHASE 1

```text
Execute ONLY Phase 1 of the Talki React Native migration.

Read first:
- docs/migration/00-current-state.md
- docs/migration/feature-parity-checklist.md
- package.json
- capacitor.config.ts

Create a new Expo SDK 57 + React Native + TypeScript application under:

apps/mobile/

Requirements:

- Expo Router
- TypeScript strict mode
- development-build friendly setup
- react-native-reanimated
- react-native-gesture-handler
- react-native-safe-area-context
- no NativeWind
- no WebView
- do not move or rename the legacy root application
- do not modify legacy index.html behavior
- do not remove Capacitor
- preserve existing npm scripts

Add convenient root npm scripts for mobile development.

Set up separate dev/prod application identifiers so development builds can coexist with the existing Talki application.

Use:
production: com.yonicks.talki
development: com.yonicks.talki.dev

Create only a minimal native bootstrap screen.

Add:
- lint
- typecheck
- test setup
- expo-doctor validation

Run all relevant checks.

Do NOT implement Home, games, audio or storage yet.

Create:
docs/migration/phase-01-report.md

Stop after Phase 1 and report:
1. files created
2. dependencies added
3. commands to run Android/iOS
4. validation results
5. any migration concerns
```

---

# PHASE 2 — Port the Domain Model and Content

> Plan: [phase-02-plan.md](docs/migration/phases/phase-02-plan.md) · Prompt: [phase-02.md](docs/migration/prompts/phase-02.md)

## Goal

Move Talki's valuable non-UI logic into typed code.

## Port

```text
CATEGORIES
word model
category model
plain()
display()
key()
totalWords()
catLearned()
currentCategory()
PRACTICE_LIST
game metadata
MIN_ITEMS
achievement definitions
audio policy
```

Introduce types:

```ts
type CategoryId = ...
type GameId = ...
type PracticeModeId = ...

interface TalkiWord {}
interface TalkiCategory {}
interface WordProgress {}
interface WordStats {}
interface TalkiSettings {}
```

Port:

```text
assets/audio/audio-logic.js
```

to:

```text
apps/mobile/src/domain/audio/audioPolicy.ts
```

Keep it pure.

## Asset registry

Generate static RN asset references automatically.

## Parity tests

Assert:

```text
10 built-in categories
182 built-in words
11 categories including "mine"
all expected games
all six practice modes
```

Also compare category word lists.

## Exit criteria

All domain/content code works without React components.

## CLAUDE / CURSOR PROMPT — PHASE 2

```text
Execute ONLY Phase 2.

Goal:
port the current Talki domain/content layer to typed, DOM-free TypeScript.

Source of truth:
current index.html and assets/audio/audio-logic.js.

Create domain modules under:
apps/mobile/src/domain/
apps/mobile/src/data/

Port:
- categories
- words
- category IDs
- game IDs
- practice-mode IDs
- settings types/defaults
- progress key semantics
- totalWords()
- catLearned()
- currentCategory()
- plain/display niqqud behavior
- MIN_ITEMS
- PRACTICE_LIST
- achievements/reward metadata required by current app
- pure audio policy

Do NOT port render functions.
Do NOT translate HTML into JSX yet.

Create tools/generate-mobile-asset-registry.mjs.

It must scan existing Talki assets and generate compile-time React Native asset mappings rather than hand-maintaining hundreds of require() calls.

Add parity tests that protect against migration mistakes.

At minimum assert:
- exact built-in category count
- exact built-in word count
- exact word list per category
- all current game IDs
- all current practice IDs
- Continue Learning behavior
- progress key behavior
- audio policy behavior

Never change the legacy source merely to make the new tests easier.

Run typecheck, lint and tests.

Create:
docs/migration/phase-02-report.md

Stop after Phase 2.
```

---

# PHASE 3 — Native Persistence and Backup Compatibility

> Plan: [phase-03-plan.md](docs/migration/phases/phase-03-plan.md) · Prompt: [phase-03.md](docs/migration/prompts/phase-03.md)

## Goal

Replace IndexedDB without changing Talki's data semantics.

## Storage abstraction

Create:

```ts
interface TalkiStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}
```

Native implementation:

```text
expo-sqlite/kv-store
```

Expo SQLite provides a persisted key/value API backed by SQLite.

## Preserve legacy keys

Initially keep:

```text
lia:progress
lia:settings
lia:stats
lia:custom:index
lia:custom:*
lia:rec:*
```

That avoids inventing a second product model during migration.

## Backup

Implement:

```text
BackupService
```

with:

```text
importV1()
exportV1()
validate()
```

The native app must be able to import a real legacy Talki backup.

Do not make a new backup version unless the schema actually changes.

## Exit criteria

Exporting/importing produces equivalent data.

## CLAUDE / CURSOR PROMPT — PHASE 3

```text
Execute ONLY Phase 3.

Implement Talki's native persistence layer and legacy backup compatibility.

Read:
- current Store implementation in index.html
- current K storage keys
- exportBackup()
- importBackup()
- custom-word storage
- recording storage
- docs/migration/00-current-state.md

Use:
expo-sqlite/kv-store

Create a TalkiStorage abstraction so screens/domain logic do not know which storage technology is used.

Preserve current logical storage keys and value shapes wherever practical:

lia:progress
lia:settings
lia:stats
lia:custom:index
lia:custom:<id>
lia:rec:<key>

Implement BackupService supporting the existing Talki backup version 1 contract.

Add validation:
- app must equal talki
- supported backup version
- malformed backup handling
- safe missing-key handling

Create tests using representative legacy backup fixtures.

Prove:
1. legacy V1 backup imports
2. progress survives reload
3. settings survive reload
4. stats survive reload
5. custom words survive reload
6. recorded-data entries survive export/import
7. exported structure remains V1-compatible

Do not build the Parent UI yet.

Run tests/typecheck/lint.

Create:
docs/migration/phase-03-report.md

Stop after Phase 3.
```

---

# PHASE 4 — Native Audio, TTS, Recording and Orientation Services

> Plan: [phase-04-plan.md](docs/migration/phases/phase-04-plan.md) · Prompt: [phase-04.md](docs/migration/prompts/phase-04.md)

## Goal

Solve the risky native platform capabilities BEFORE building many screens.

Create service interfaces:

```text
AudioEngine
WordVoiceService
RecordingService
SpeechRecognitionService
OrientationService
```

## AudioEngine

Port existing semantics:

```text
music state
crossfade
SFX pool
ducking
voicePrompt
listening
speaking
cooldowns
reward volume
AppState pause/resume
```

Do not let game components know MP3 filenames.

## Word voice

Resolution:

```text
parent recording
→ bundled Talki recording
→ Hebrew TTS
```

## Recording

Use Expo Audio.

Persist a representation compatible with the backup service.

## Orientation

Central policy.

Game routes:

```text
landscape
```

Non-game routes:

```text
responsive/default
```

This can be changed later without rewriting screens.

## Speech-recognition spike

Do only a technical proof here.

The current popular `expo-speech-recognition` package implements native iOS/Android speech recognition, but its current published line is still aligned to SDK 56 and there are current SDK-57 Android issues around some continuous-recognition flows.

Therefore:

Do not make all Talki development depend on it yet.

Test a small single-word `he-IL` POC first.

## Exit criteria

Physical/native proof of:

```text
music
SFX
TTS
recording
orientation
app background/resume
```

## CLAUDE / CURSOR PROMPT — PHASE 4

```text
Execute ONLY Phase 4.

This is a native-capability proof phase.

Implement abstractions for:

- AudioEngine
- WordVoiceService
- RecordingService
- OrientationService
- SpeechRecognitionService interface

Use expo-audio for music/SFX/recording.
Use expo-speech for TTS.
Use expo-screen-orientation / Expo Router orientation support.

Port the behavioral rules from:
audio-manager.js
assets/audio/audio-logic.js

Preserve:
- semantic SFX event names
- music-state resolution
- cooldowns
- max simultaneous SFX
- ducking priority:
  speaking > listening > voice prompt
- fade/crossfade intent
- user volume multiplier
- app foreground/background lifecycle behavior

Create WordVoiceService with this priority:
1. parent recording
2. bundled Talki voice if available
3. he-IL TTS fallback

Do not call expo-speech or expo-audio directly from feature screens.

Orientation policy must be centralized.

Add a temporary internal dev screen that can test:
- music
- SFX
- TTS
- recording/playback
- orientation lock/unlock

Also perform a small isolated speech-recognition compatibility POC for he-IL.
Do NOT integrate it into a real game yet.
If the third-party package is unstable on the selected Expo SDK, document it rather than contaminating the architecture.

Run on Android, not only web.

Create:
docs/migration/phase-04-report.md

Include native capability results and known platform differences.

Stop after Phase 4.
```

---

# PHASE 5 — Talki Native Design System and App Shell

> Plan: [phase-05-plan.md](docs/migration/phases/phase-05-plan.md) · Prompt: [phase-05.md](docs/migration/prompts/phase-05.md)

## Goal

Build the foundation once instead of restyling every game independently.

## Design tokens

Port the approved Talki V2/V3 palette:

```text
#6D3BA6
#7C4CD6
#8FD3C1
#FFCDA1
#FFD75A
#FFD9E6
...
```

And existing spacing/radius/shadow hierarchy.

## Typography

Bundle:

```text
Assistant
Rubik
```

rather than relying on runtime Google Fonts.

## Components

Create primitives such as:

```text
TalkiScreen
TalkiText
TalkiHeading
TalkiButton
TalkiCard
TalkiIconButton
TalkiProgress
TalkiPill
TalkiImageCard

TopBar
BottomNavigation
GameHeader
ParentGate
ToastHost
RewardOverlay
```

## Responsive system

Do not build CSS-style device detection everywhere.

Centralize:

```text
phone
large phone
small tablet
large tablet
portrait
landscape
safe area
```

## Exit criteria

A component gallery/dev screen demonstrates the full native visual system.

## CLAUDE / CURSOR PROMPT — PHASE 5

```text
Execute ONLY Phase 5.

Build the reusable Talki React Native design system and application shell.

Sources:
- current :root CSS design tokens in index.html
- docs/talki-home-redesign-cursor-plan.md
- docs/design/talki-home-approved.png
- existing assets/v2/**
- current TopBar and BottomNav behavior

Do NOT mechanically convert CSS to React Native styles.

Create a native design system with centralized:
- colors
- typography
- spacing
- radii
- shadows/elevation
- breakpoints/responsive helpers
- safe-area handling
- RTL helpers

Bundle Assistant and Rubik fonts locally through appropriate Expo/font packages.

Create reusable native primitives and shared shell components.

No NativeWind.
No DOM terminology.
No HTML.
No CSS files.
No WebView.

Use logical RTL-safe layout and verify Hebrew visually.

Build a development component-gallery screen showing all primitives on:
- phone portrait
- phone landscape
- tablet landscape

Do not build Home yet.

Run validation and create:
docs/migration/phase-05-report.md

Stop after Phase 5.
```

---

# PHASE 6 — Yonicks Studios Native Opening Sequence

> Plan: [phase-06-plan.md](docs/migration/phases/phase-06-plan.md) · Prompt: [phase-06.md](docs/migration/prompts/phase-06.md)

## Goal

Make our new opening sequence the first polished native experience.

Do NOT render a video.

Use the separate logo layers:

```text
star/decorations
Yonicks
Studios/decorations
```

Build the sequence with Reanimated.

Possible sequence:

```text
0ms
soft background appears

150ms
star enters / scales

450ms
small surrounding sparkles

650ms
"Yonicks" appears

950ms
"Studios" appears

1200ms
gentle final bounce/glow

1500–1800ms
transition into Talki
```

Audio hook should use `AudioEngine`, even if the final intro SFX is added later.

Responsive safe zone must work in both portrait and landscape.

## Exit criteria

No clipping on:

```text
phone portrait
phone landscape
4:3 tablet
16:10 tablet
```

## CLAUDE / CURSOR PROMPT — PHASE 6

```text
Execute ONLY Phase 6.

Implement the native Yonicks Studios opening sequence.

Use the approved separate Yonicks Studios logo assets in the repository.

Do not render an MP4/video.
Do not recreate text with a system font.
Do not add placeholder emoji.

Use React Native Reanimated to animate the real logo layers.

Requirements:
- very short
- premium
- playful
- suitable for toddler games
- no aggressive flashing
- portrait safe
- landscape safe
- tablet safe
- respects safe area
- deterministic sequence
- no jank during app startup

Integrate with the existing AudioEngine abstraction but keep the sound replaceable/configurable.

After completion, transition cleanly into the Talki route.

Test at:
- small phone portrait
- phone landscape
- iPad-like 4:3
- Android tablet-like 16:10

Create:
docs/migration/phase-06-report.md

Stop after Phase 6.
```

---

# PHASE 7 — Home, Navigation and Categories

> Plan: [phase-07-plan.md](docs/migration/phases/phase-07-plan.md) · Prompt: [phase-07.md](docs/migration/prompts/phase-07.md)

## Goal

Implement the approved Talki experience directly in React Native.

Visual source:

```text
docs/design/talki-home-approved.png
```

plus newer approved mocks where they supersede it.

Do not port the old Home CSS.

Build:

```text
Home
Top header
welcome banner
Continue Learning
categories
practice preview
games preview
bottom navigation
category page
rewards entry
```

Use real data.

Never hardcode:

```text
points
progress
category percentages
Continue Learning category
```

Render all actual categories, not just those visible in an old mock.

## Exit criteria

A child can:

```text
launch Talki
→ Home
→ select category
→ browse words
→ return Home
```

using native navigation.

## CLAUDE / CURSOR PROMPT — PHASE 7

```text
Execute ONLY Phase 7.

Implement the native Talki Home/navigation/category experience.

Visual source of truth:
docs/design/talki-home-approved.png
plus any newer approved Talki mocks already present in the repository.

Functional source of truth:
current index.html and the migrated domain layer.

Build:
- TopBar
- Home
- Welcome Hero
- Continue Learning card
- Categories section
- Practice preview
- Games preview
- Bottom Navigation
- Category screen
- basic Rewards navigation target

Use REAL migrated data.

Preserve:
- points = learned word count
- category progress
- currentCategory() semantics
- all categories, including dynamic My Words when applicable
- niqqud setting behavior
- RTL

Do not copy legacy CSS literally.
Do not hardcode screenshot values.
Do not remove categories because a mockup has fewer cards.

Use current Talki assets rather than emoji placeholders.

Validate against the approved mock visually.

Capture native screenshots for:
- phone portrait
- phone landscape
- tablet

Create:
docs/migration/phase-07-report.md

Stop after Phase 7.
```

---

# PHASE 8 — Game Platform + First Full Game: "איפה ה...?"

> Plan: [phase-08-plan.md](docs/migration/phases/phase-08-plan.md) · Prompt: [phase-08.md](docs/migration/prompts/phase-08.md)

## Why this first

Not Flashcards.

Quiz is the best architectural vertical slice because it exercises:

```text
navigation
category selection
randomized content
audio prompt
images
answer input
correct/incorrect
score
streak
stats
SFX
completion screen
orientation
```

If Quiz works properly, the architecture is proven.

## Build shared game infrastructure

```text
GameShell
GameSession
GameHeader
GameProgress
GamePrompt
GameOption
GameResult
GameReward
```

Then port:

```text
quiz
"איפה ה...?"
```

## Exit criteria

One complete production-quality game runs from Home → Game → Result → Home.

## CLAUDE / CURSOR PROMPT — PHASE 8

```text
Execute ONLY Phase 8.

First build the reusable native GameShell architecture.

Then port exactly one real game:
quiz / "איפה ה...?"

Functional source:
current startGame('quiz'), setupQuizRound, nextQuiz, renderQuiz and related handlers/stat updates in index.html.

Do NOT simplify the game merely to make it run.

Preserve:
- category selection/fallback
- minimum item rules
- round generation
- audio prompt
- replay
- answer correctness
- score
- streak
- stats/progress updates
- completion flow
- Talki audio events

Game route must follow the centralized landscape orientation policy.

Use the native AudioEngine and WordVoiceService.

Build reusable GameShell primitives only where they make sense for future games.

Add domain and interaction tests.

Validate full flow:
Home
→ Games
→ Quiz
→ multiple rounds
→ completion
→ Home

Create:
docs/migration/phase-08-report.md

Do not port another game in this run.

Stop after Phase 8.
```

---

# PHASE 9 — Core Games Wave A

> Plan: [phase-09-plan.md](docs/migration/phases/phase-09-plan.md) · Prompt: [phase-09.md](docs/migration/prompts/phase-09.md)

Port individually:

```text
Memory
Missing
Matching
Flashcards
```

Why this batch:

They establish the reusable interaction patterns needed by most remaining games.

### Memory

Tests:

```text
card flip
pair matching
move count
completion
```

### Missing

Tests:

```text
show phase
hide/disappear phase
answer phase
timers
```

### Matching

Tests:

```text
drag/tap matching
correct match
incorrect move
completion
```

### Flashcards

Tests:

```text
swipe
previous/next
speak
learned state
```

## CLAUDE / CURSOR PROMPT — PHASE 9

```text
Execute ONLY Phase 9.

Port these Talki games one by one:

1. memory
2. missing
3. match
4. cards / flashcards

For EACH game:
- inspect its complete existing implementation first
- identify state/setup/render/handlers
- port behavior, not HTML
- use GameShell
- use domain services
- use AudioEngine
- use WordVoiceService
- respect category/min-item rules
- preserve completion/progress/stat behavior

Use Reanimated/Gesture Handler where interaction requires it.

Do not implement later games yet.

After each game:
- add tests
- manually complete one entire session
- verify landscape phone
- verify tablet
- verify RTL
- verify audio

Do not leave one half-finished because the next game looks easier.

Create:
docs/migration/phase-09-report.md

Stop after all four games pass.
```

---

# PHASE 10 — Games Wave B

> Plan: [phase-10-plan.md](docs/migration/phases/phase-10-plan.md) · Prompt: [phase-10.md](docs/migration/prompts/phase-10.md)

Port:

```text
sounds
count
bubbles
sort
puzzle
```

These should reuse the game infrastructure instead of inventing separate shells.

Special attention:

```text
Bubbles → animation lifecycle
Sort → category semantics
Puzzle → drag/drop tolerance
Sounds → animal-sound playback
Count → repeated image layout on tablets
```

## CLAUDE / CURSOR PROMPT — PHASE 10

```text
Execute ONLY Phase 10.

Port the remaining non-speech-recognition arcade games from current index.html:

- sounds
- count
- bubbles
- sort
- puzzle

Before implementing each game, inspect the current source and record:
- setup state
- round logic
- completion condition
- score/progress effects
- audio calls
- timers
- interaction edge cases

Reuse GameShell and the existing domain/native services.

Do not redesign game rules.

Improve only presentation/interaction implementation to be native and responsive.

All games must support:
- landscape phone
- tablet
- app background/resume without broken timers
- interruption-safe audio
- rapid toddler tapping without duplicate state transitions

Add tests.

Create:
docs/migration/phase-10-report.md

Stop after Phase 10.
```

---

# PHASE 11 — Speech Practice + Speech Recognition

> Plan: [phase-11-plan.md](docs/migration/phases/phase-11-plan.md) · Prompt: [phase-11.md](docs/migration/prompts/phase-11.md)

Port all six evidence-based practice modes:

```text
focus
receptive
cloze
temptation
pairs
combine
```

Then port:

```text
speech / תגידי את זה
```

## Important

The six practice activities must NOT depend on speech recognition unless their existing behavior actually requires it.

Speech recognition remains behind:

```ts
SpeechRecognitionService
```

That allows us to replace the underlying library later.

For the actual recognition game, prioritize:

```text
he-IL
short utterance / single word
continuous: false
graceful permission denial
graceful unsupported-device state
```

Do not turn a speech activity into a generic voice assistant.

## CLAUDE / CURSOR PROMPT — PHASE 11

```text
Execute ONLY Phase 11.

Port Talki's evidence-based speech-practice modes:

- focus
- receptive
- cloze
- temptation
- pairs
- combine

Functional source:
current index.html implementations and docs/migration/00-current-state.md.

Preserve the actual clinical/activity mechanics.
Do not redesign them into generic games.

Use:
- WordVoiceService
- AudioEngine
- RecordingService where appropriate
- Game/Practice shared primitives
- native timers that clean up correctly on unmount/background

After those six modes work, integrate the speech-recognition-backed "speech / תגידי את זה" experience through SpeechRecognitionService.

Do not import a recognition library directly inside the screen.

Target:
he-IL
short/single-word recognition
non-continuous recognition unless testing proves another mode is necessary

Handle:
- permission denied
- no recognizer available
- no speech
- incorrect recognition
- canceled recognition
- app background
- Android/iOS behavior differences

If the selected recognition package has an Expo SDK 57 incompatibility, isolate/document the issue and use a validated version/patch or local native Expo module rather than polluting the rest of Talki.

Do not downgrade the whole application architecture casually to solve one optional capability.

Create:
docs/migration/phase-11-report.md

Stop after Phase 11.
```

---

# PHASE 12 — Parent Center, Custom Words, Recordings and Rewards

> Plan: [phase-12-plan.md](docs/migration/phases/phase-12-plan.md) · Prompt: [phase-12.md](docs/migration/prompts/phase-12.md)

## Parent area

Port the real behavior:

```text
parent protection/gate
settings
recordings
custom words
progress/reporting
method information
backup
reset
```

Preserve the current safety behavior where leaving the parent area re-locks it.

## Custom words

Support:

```text
word
photo
voice recording
category "mine"
delete/edit
```

## Settings

Port:

```text
music
SFX
voice
speech rate
niqqud
effects
```

## Rewards

Port:

```text
stickers
achievements
earned state
progress
```

## Backup UI

Expose the Phase 3 service:

```text
Export
Import
validation
confirmation
```

## CLAUDE / CURSOR PROMPT — PHASE 12

```text
Execute ONLY Phase 12.

Port Talki's parent/rewards functionality.

Inspect the current parent implementation completely before coding.

Implement:

PARENT:
- parent-entry protection
- parent gate
- settings
- progress/report
- speech-method information
- reset behavior

CUSTOM WORDS:
- add word
- choose/photo image
- save
- delete
- My Words integration

RECORDINGS:
- record parent voice
- playback
- replace
- delete
- ensure WordVoiceService uses recording override

SETTINGS:
- rate
- niqqud
- sounds/SFX
- effects
- music
- music volume
- voice

BACKUP:
- export V1-compatible Talki backup
- import legacy V1 backup
- validation/error UI

REWARDS:
- stickers
- achievements
- earned/unearned state

Preserve parent re-lock behavior when leaving the parent area.

Do not expose parent controls accidentally through ordinary toddler navigation.

Add permission-denial handling for photo/audio.

Run a real legacy-backup import test on the native app.

Create:
docs/migration/phase-12-report.md

Stop after Phase 12.
```

---

# PHASE 13 — AdMob and Native Application Configuration

> Plan: [phase-13-plan.md](docs/migration/phases/phase-13-plan.md) · Prompt: [phase-13.md](docs/migration/prompts/phase-13.md)

## Goal

Replace Capacitor-specific native infrastructure.

Port:

```text
app identity
splash
icons
status/navigation bars
AdMob
permissions
privacy configuration
```

Use development/test advertising IDs until release configuration.

Preserve existing child-directed/non-personalized advertising intent.

Do not add additional ad placements during the migration.

## Production identity

```text
com.yonicks.talki
```

## Development identity

```text
com.yonicks.talki.dev
```

## CLAUDE / CURSOR PROMPT — PHASE 13

```text
Execute ONLY Phase 13.

Configure Talki's native production shell.

Migrate the current Capacitor-native responsibilities to Expo configuration.

Implement:
- app name
- bundle/package identifiers
- app icon
- adaptive Android icon
- splash
- background color
- status/navigation-bar behavior
- orientation configuration
- microphone permission descriptions
- photo/document permissions where required

Replace @capacitor-community/admob with react-native-google-mobile-ads.

Do NOT add new ad placements.

Match the current Talki advertising intent:
- child-directed
- non-personalized
- appropriate content rating
- test IDs in non-production environments

Keep production IDs/configuration isolated from development.

Use development builds; do not make Expo Go support a requirement.

Audit all permissions and remove permissions not required by actual Talki functionality.

Create:
docs/migration/phase-13-report.md

Do not remove legacy Capacitor yet.

Stop after Phase 13.
```

---

# PHASE 14 — Full Parity, Device QA and Performance

> Plan: [phase-14-plan.md](docs/migration/phases/phase-14-plan.md) · Prompt: [phase-14.md](docs/migration/prompts/phase-14.md)

## This is the main release gate.

Take:

```text
docs/migration/feature-parity-checklist.md
```

and verify every line.

## Required device matrix

At minimum:

```text
small iPhone
large iPhone

small Android phone
large Android phone

iPad / 4:3
Android tablet / ~16:10
```

## Test

### Orientation

```text
launch
intro
Home
open game
landscape transition
leave game
background
foreground
rotate device
tablet multitasking rules
```

### Audio

```text
music
SFX
voice
recordings
ducking
rapid taps
headphones
background/foreground
interruptions
silent mode
```

### Data

```text
progress
settings
stats
custom words
photos
recordings
backup
restore
app restart
app upgrade
```

### Offline

Talki currently has no backend requirement.

The native app must continue to work without a network connection for its core educational experience.

### Toddler abuse testing

Test:

```text
20 rapid taps
double taps
holding buttons
dragging outside targets
backgrounding mid-game
opening/closing quickly
screen rotation mid-animation
interrupting audio repeatedly
```

### Performance

Check:

```text
startup
JS frame drops
UI frame drops
memory
image decode/load
audio player cleanup
animation cleanup
unmounted timers
speech-recognition cleanup
```

## E2E

Add Maestro flows for critical paths:

```text
start → Home
Home → category
Home → Quiz → finish
Memory → finish
Parent gate
change setting
add custom word
backup import
```

## CLAUDE / CURSOR PROMPT — PHASE 14

```text
Execute ONLY Phase 14.

This is a parity/quality phase, not a feature-development phase.

Read:
docs/migration/feature-parity-checklist.md
all phase reports
current legacy README/index.html

Verify EVERY legacy feature against the React Native implementation.

Do not mark something complete because a route merely exists.
Exercise the real behavior.

Run device/responsive QA across:
- small phone
- large phone
- iPhone
- Android
- 4:3 tablet
- 16:10 tablet

Test:
- RTL
- Hebrew text and niqqud
- safe areas
- landscape games
- orientation transitions
- rapid toddler input
- audio
- recording
- TTS
- speech recognition
- custom words
- progress
- rewards
- backup/restore
- offline startup/use
- background/resume
- permission denial
- malformed backup

Add Maestro E2E flows for the critical user journeys.

Profile performance and fix:
- leaked timers
- leaked audio players
- unnecessary re-renders
- giant image loads
- animation jank
- game-state race conditions

Create:
docs/migration/phase-14-release-readiness.md

The report must contain PASS/FAIL for every parity item.

Do not proceed to production cutover if any critical item is FAIL.

Stop after Phase 14.
```

---

# PHASE 15 — Native Cutover and Capacitor Retirement

> Plan: [phase-15-plan.md](docs/migration/phases/phase-15-plan.md) · Prompt: [phase-15.md](docs/migration/prompts/phase-15.md)

## Only execute after Phase 14 passes.

Create a legacy tag:

```text
legacy-capacitor-final
```

Build native release candidates using EAS.

Expo EAS Build can produce signed Android/iOS binaries and supports development, preview and production build profiles.

Recommended:

```text
development
preview
production
```

profiles.

First:

```text
internal Android build
TestFlight build
```

Then store release.

After production native build is proven:

```text
Capacitor becomes legacy
```

Do NOT delete it before then.

Eventually remove/archive:

```text
root android/
root ios/
capacitor.config.ts
Capacitor dependencies
prepare_www
native Capacitor scripts
```

Keep the legacy source tagged in git.

Decide separately whether the PWA remains publicly available.

React Native migration and killing the web version are two different decisions.

## CLAUDE / CURSOR PROMPT — PHASE 15

```text
Execute ONLY Phase 15.

First verify:
docs/migration/phase-14-release-readiness.md

Do not continue unless every critical parity item is PASS.

Prepare the React Native Talki application for production cutover.

Tasks:

1. record/tag the final legacy Capacitor revision
2. configure EAS development/preview/production profiles
3. validate production app ID com.yonicks.talki
4. validate version/build-number strategy
5. create production Android configuration
6. create production iOS configuration
7. verify signing configuration
8. produce internal release candidate
9. document TestFlight/Play internal testing steps
10. update README so React Native is the primary application
11. update development commands
12. update architecture documentation

Do NOT remove the legacy Capacitor implementation until the native release candidate has been installed and validated.

After validation, prepare a separate cleanup commit that removes obsolete Capacitor/native-wrapper dependencies while retaining git history/tag access.

Do not redesign or add features during this phase.

Create:
docs/migration/phase-15-cutover-report.md

Stop after Phase 15.
```

---

# 11. Migration Order Summary

```text
PHASE 0
Current-state audit
        ↓
PHASE 1
Expo foundation
        ↓
PHASE 2
Domain + content + assets
        ↓
PHASE 3
Storage + legacy backup
        ↓
PHASE 4
Audio/TTS/recording/orientation
        ↓
──────────── TECHNICAL GO/NO-GO ────────────
        ↓
PHASE 5
Native design system
        ↓
PHASE 6
Yonicks Studios intro
        ↓
PHASE 7
Home + categories + navigation
        ↓
PHASE 8
GameShell + Quiz
        ↓
──────────── ARCHITECTURE GO/NO-GO ─────────
        ↓
PHASE 9
Memory / Missing / Matching / Cards
        ↓
PHASE 10
Sounds / Count / Bubbles / Sort / Puzzle
        ↓
PHASE 11
Speech practice + recognition
        ↓
PHASE 12
Parent / custom words / rewards / backup
        ↓
──────────── FEATURE PARITY GATE ────────────
        ↓
PHASE 13
Ads + native configuration
        ↓
PHASE 14
QA + parity + performance
        ↓
──────────── RELEASE GO/NO-GO ───────────────
        ↓
PHASE 15
Native release + Capacitor retirement
```

---

# 12. What We Should NOT Do

Do not:

```text
❌ rewrite everything at once
❌ delete Capacitor now
❌ move legacy files around now
❌ embed old Talki in a WebView
❌ convert HTML line-by-line to JSX
❌ convert CSS line-by-line
❌ make every game state global
❌ create a backend
❌ change the progress model during migration
❌ change backup schema unnecessarily
❌ hardcode 182 image requires manually
❌ implement all games before proving one
❌ couple game screens directly to Expo APIs
❌ make speech-recognition library choice infect domain logic
❌ use screenshots as fake UI
❌ use Expo Go as a production-development constraint
```

---

# 13. Definition of Migration Success

The migration is finished when:

```text
✓ Talki installs as a real native Android app
✓ Talki installs as a real native iOS app

✓ Yonicks Studios intro works
✓ Home matches approved design
✓ game screens work in landscape
✓ phone layouts work
✓ tablet layouts work

✓ all categories exist
✓ all words exist
✓ all games exist
✓ all six speech-practice modes exist

✓ Hebrew RTL works
✓ niqqud works

✓ progress survives restart
✓ settings survive restart
✓ custom words survive restart
✓ parent recordings survive restart

✓ legacy Talki backups import

✓ music works
✓ SFX works
✓ TTS works
✓ recording works
✓ audio ducking works

✓ parent gate works
✓ rewards work
✓ ads work with correct child configuration

✓ core app works offline

✓ rapid toddler interaction does not break game state

✓ Android release build passes
✓ iOS release build passes

✓ feature-parity checklist is 100% critical PASS
```

Only then should Capacitor stop being the primary Talki runtime.

---

# 14. Corrections Log — 2026-09-01

This document was written before a line-level audit of the live application.
The audit found nine places where it contradicted `index.html` at commit
`edbe634`. Each is corrected in place above; they are listed here so anyone
who read an earlier revision knows what moved.

Left uncorrected, several of these would have produced a native app that
silently loses user data or changes behaviour.

**1. Continue Learning had a missing first step.**
Section 2 described `currentCategory()` as three steps starting from the
highest-completion partial category. The real implementation (index.html
2206-2216) has four, and the first is: if `lastCat` is set and that category
is not fully learned, return it. Without step 1 a child who opens a category,
learns two words and closes the app would be sent somewhere else on return.

**2. A seventh storage key was missing.**
Section 2 listed six key patterns. `K` (index.html 1633-1637) defines seven.
The missing one is `lia:lastcat`, which is what drives correction 1. Dropping
it would have made the bug in correction 1 unfixable.

**3. Backup import accepts two app names, not one.**
The Phase 3 prompt said "app must equal talki". The real check (index.html
1781) is `payload.app === 'talki' || payload.app === 'lia-words'`. `lia-words`
is the product's former name and appears in real user backups. Enforcing the
stricter rule would have rejected exactly the files the compatibility
requirement exists to protect.

**4. Backup import has two modes.**
`merge` and `replace` were undocumented. `replace` clears every key first;
`merge` unions the `lia:progress` array through a `Set` and overwrites
everything else (index.html 1783-1792).

**5. Settings has two runtime keys absent from the defaults literal.**
`lastBackup` (1771) and `puzzleLevel` (2973-2978) are written at runtime. A
port that types settings from the defaults object alone would drop the child's
adaptive puzzle difficulty on every backup round trip.

**6. Recordings are data URLs, not files.**
`lia:rec:<catId:word>` holds an audio data URL string. This matters twice: it
is why a native port should move to files on disk, and it is why export must
convert back to data URLs to stay V1-compatible.

**7. Orientation is a deviation, not a port.**
Section 6 presented landscape games as if porting existing behaviour. The
legacy app is hard-locked to portrait in two places (index.html 4088 and
`manifest.json`). Landscape is a deliberate product change and is now labelled
as one, so Phase 14 does not grade it as a regression.

**8. The Expo version needed a floor, not just a major.**
SDK 57 alone is not sufficient. Releases before 57.0.9 carry a Hermes v1
memory regression affecting any app that imports Reanimated, and releases
before 57.0.17 carry a development startup regression. Talki uses Reanimated
throughout, so the pin is `>= 57.0.17`.

**9. Counts were unverified.**
The document asserted 182 words without a source. The audit confirms 182
across 10 categories, and additionally fixes the inventory at 23 views, 11
games, 6 practice modes, 24 stickers, 22 SFX events and 10 mapped music
states. All are now line-referenced in
[docs/migration/feature-parity-checklist.md](docs/migration/feature-parity-checklist.md).

## Defects found in passing

Not migration blockers, but recorded so they are not reproduced or silently
inherited:

- `tools/prepare_www.js` never copies `audio-manager.js` into `www/`, although
  both `index.html` and `sw.js` reference it. The Capacitor build is therefore
  shipping without its audio runtime.
- `tests/interaction_suite.py` declares `SHOT_DIR` and never writes a
  screenshot.
- `tools/sweep.js` and `tools/audio-check.js` default to port 5173, left over
  from a Vite setup, while the app and CI use 8000.
- `tools/make_store.py` hardcodes `ROOT = /home/claude/build/lia-app`, a path
  that does not exist in this repository.
- `tools/screenshot.js` documents a `--wait=selector` flag it does not
  implement.
- `assets/audio/music/02_gameplay_bouncy.mp3`, `03_gameplay_curious.mp3` and
  `04_gameplay_gentle.mp3` exist on disk but are not mapped by
  `MUSIC_FILES`.