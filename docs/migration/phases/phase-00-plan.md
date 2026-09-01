# Phase 0 — Freeze and audit the migration baseline

**Prompt:** [../prompts/phase-00.md](../prompts/phase-00.md)
**Writes:** `docs/migration/00-current-state.md`, `docs/migration/phase-00-report.md`,
`docs/migration/screenshots/legacy-baseline/`, `tools/capture-legacy-baseline.mjs`
**Touches no application code.**

---

## Goal and rationale

Produce a definitive, line-referenced description of what Talki does today, and
a visual reference set of what it looks like, before a single line of React
Native is written.

This phase exists because of a specific failure mode. Fifteen phases from now,
someone will ask "did the native quiz preserve the streak behaviour?" and the
only way to answer will be to re-read a 4300-line HTML file. Worse, by then
`index.html` may have moved on, so the question becomes unanswerable. The audit
freezes the answer at a known commit.

The visual baseline exists for the same reason. Phase 7 will build Home, and
"does it match?" needs something concrete to match against. The approved mock
covers one screen at one size; the baseline covers 23 views at 10 sizes.

Nothing here changes behaviour. That is the point.

## Entry conditions

- None. This is the first phase.
- The working tree should be clean enough that the audit describes a real
  commit. Record the commit SHA in the report.

## Design decisions

### Audit the executable, not the documentation

`docs/talki-home-redesign-audit.md`, `docs/talki-home-redesign-plan.md` and
`docs/talki-home-redesign-cursor-plan.md` total roughly 118 KB of prose that
was accurate when written. The live code has moved past parts of it. The audit
must therefore treat `index.html` as primary and explicitly record every place
a document disagrees.

Rejected alternative: summarising the existing documents. That would launder
stale claims into the migration's foundation, which is exactly the failure this
phase is meant to prevent.

### Capture the baseline programmatically, not by hand

A new script, `tools/capture-legacy-baseline.mjs`, drives the legacy app with
Playwright and captures 23 views at 10 viewports. Doing this by hand would be
230 screenshots of manual work and would not be repeatable.

The script sets `view` directly through `page.evaluate()` rather than
navigating through the UI. Some views are only reachable after a game has been
set up, and the goal here is a visual reference, not an interaction test.
`tools/sweep.js` already uses this technique and is the model.

Rejected alternative: reusing `tools/screenshot.js` in a shell loop. It takes
one shot per process launch, so 230 shots would mean 230 Chromium starts.

### The checklist is seeded, not discovered

`docs/migration/feature-parity-checklist.md` already exists with the inventory
filled in. Phase 0 verifies it rather than building it from nothing.

This is deliberate. An agent asked to enumerate every feature of a 4300-line
file will produce a plausible list with two or three omissions, and nobody will
notice which ones. Asking it to verify a specific claim — "there are exactly 23
view identifiers, here they are, confirm or correct" — produces a checkable
answer. Where the checklist is wrong, the agent corrects it and records the
correction.

### Do not fix anything

The audit will surface defects. `tools/prepare_www.js` omits `audio-manager.js`
from the Capacitor bundle, which means the shipped native app has no audio
runtime. That is a real bug and it is tempting to fix.

It stays unfixed in this phase. A phase whose contract is "change nothing"
must change nothing, or the baseline it produces is not a baseline. Defects are
recorded in the report and in checklist section 15, and get fixed on their own
merits later.

## Legacy source mapping

The audit must cover, at minimum, these regions of `index.html`:

| Area | Lines |
|---|---|
| `:root` design tokens | 28-68 |
| Topbar chrome and layout vars | 83-125 |
| `body[data-view]` backgrounds | 184-205 |
| `HOME_PRACTICE_HOME` | 1383-1387 |
| `art()` asset path helper | 1476-1479 |
| `CATEGORIES` | 1480-1592 |
| `CARRIERS`, `CLOZE`, `PAIRS`, `MODIFIERS` | 1597-1628 |
| `K` storage keys | 1633-1637 |
| Runtime state and `settings` defaults | 1639-1651 |
| `Store` (IndexedDB / artifact / memory) | 1662-1745 |
| `exportBackup` / `importBackup` | 1752-1799 |
| `loadAll` | 1801- |
| `enterCat`, niqqud helpers, `key`, `totalWords`, `catLearned` | 1823-1846 |
| `weightedPick`, `markSeen` | 1869-1883 |
| TTS: `say`, `speakTTS`, voice selection | 1888-1987 |
| `SPEECH_VIEWS` | 2018 |
| Points rendering | 2075-2079 |
| `render()` and the `views` map | 2082-2116 |
| History and back handling | 2118-2147 |
| `currentCategory` | 2206-2216 |
| `PRACTICE_LIST` | 2218-2225 |
| All 23 render functions | 2227-3229 |
| `STICKERS`, `stickerUnlocked` | 2417-2447 |
| `gameHeader`, `chips`, `MIN_ITEMS`, `startGame` | 2480-2555 |
| Puzzle subsystem | 2764-3059 |
| Parent gate and tabs | 3220-3376 |
| Event binding | 3397-3760 |
| `startListening`, `listenForAnything` | 3841-3917 |
| Recording | 3919-3957 |
| Native shell, AdMob, wake lock, orientation lock | 4050-4143 |
| Start gate and deep link | 4239-4247 |

Plus `audio-manager.js` in full, `assets/audio/audio-logic.js` in full,
`capacitor.config.ts`, `manifest.json`, `sw.js`, `package.json`, and
`.github/workflows/test-and-deploy.yml`.

## Files to be created

```
tools/capture-legacy-baseline.mjs          Playwright loop, 23 views x 10 viewports
docs/migration/00-current-state.md         the audit itself
docs/migration/phase-00-report.md          the phase report
docs/migration/screenshots/legacy-baseline/
    <viewport>-<view>.png                  230 files
```

`docs/migration/feature-parity-checklist.md` is edited in place, not recreated.

## Structure of 00-current-state.md

Fixed headings, because Phase 14 reads this document:

1. Provenance — commit SHA, date, files inspected with line counts
2. Application shape — entry, start gate, render loop, navigation, history
3. Views — all 23 with render function and line range
4. Games — all 11 with setup, render, handlers, completion, stats effects
5. Practice modes — all 6 with mechanics described in clinical terms
6. Vocabulary — categories, counts, item shape, `art()` path rules, `mine`
7. Progress — key format, points, `totalWords`, `catLearned`, `currentCategory`
8. Persistence — backends, all 7 keys, value shapes, failure behaviour
9. Settings — defaults plus runtime keys, and which UI writes each
10. Backup — schema, both app names, both modes, error handling
11. Audio — music states, SFX events, ducking, cooldowns, lifecycle
12. Voice — TTS resolution, recording, recognition, degraded behaviour
13. Rewards — 24 stickers and their three unlock kinds
14. Parent area — gate, tabs, re-lock, reset semantics
15. Platform — Capacitor, PWA, AdMob, wake lock, orientation, offline
16. Tests and CI — what runs, where, and what does not run
17. Documentation drift — every stale claim found, with the correct value
18. Defects found — including the ones already listed in checklist section 15
19. Migration risks

## Behaviour to preserve exactly

Nothing is being changed, so the invariant is simply: `git diff` at the end of
this phase touches only `docs/migration/**` and adds
`tools/capture-legacy-baseline.mjs`. No file under `assets/`, `tests/`,
`android/`, `ios/`, and not `index.html`, `audio-manager.js`, `sw.js`,
`manifest.json`, `package.json` or `capacitor.config.ts`.

## Test plan

### Tier 1

Not applicable — no new logic.

### Tier 2

Not applicable in the mobile sense; there is no mobile app yet. Instead, the
legacy Playwright suites are run as the baseline:

```bash
node tools/dev-server.js &
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```

Their results are the inherited baseline for every later phase. If any suite is
already red, that is recorded verbatim, not fixed.

### Tier 3

Not applicable.

### Self-consistency checks

The audit must independently confirm these counts and fail loudly if any
disagrees with the seeded checklist:

- 23 view identifiers in the `views` map
- 11 game ids reachable through `startGame`
- 6 entries in `PRACTICE_LIST`
- 10 built-in categories
- 182 built-in words, and the per-category split 26/26/26/26/18/16/12/12/10/10
- 24 entries in `STICKERS`
- 7 key patterns on `K`
- 22 keys in `SFX_FILES`
- 10 keys in `MUSIC_FILES`
- 16 entries in `MIN_ITEMS`

Counting must be programmatic. A throwaway script under `/tmp` is fine; do not
add a counting script to the repository.

## Screenshot manifest

`tools/capture-legacy-baseline.mjs` produces
`docs/migration/screenshots/legacy-baseline/<viewport>-<view>.png` for the
cross product of:

Viewports: `320x568`, `360x800`, `390x844`, `430x932`, `768x1024`, `834x1112`,
`844x390`, `932x430`, `1024x768`, `1280x800`.

Views: all 23, plus `parent-locked` for the gate screen and
`category-animals` for a populated category.

That is 250 files. They are committed. At roughly 60-120 KB each this is
15-30 MB, which is acceptable for a one-time reference set; if it exceeds
40 MB, downscale to a 2x cap rather than dropping viewports.

The script must be deterministic: seed a fixed set of learned words before
capture so progress bars and star counts do not vary between runs.

## Risks and open questions

**Some views may not render standalone.** Setting `view = 'quiz'` without a
game object may produce an empty screen. Default: call `launch(type, 'animals')`
for game and practice views, and set `view` directly only for the static ones.
Record which views needed which treatment.

**Screenshot volume in git.** Default: commit them. They are the reference set
and are useless if a reviewer cannot see them. Revisit only if the repository
becomes unwieldy.

**The audit is long.** `00-current-state.md` will be substantial, likely
1500+ lines. That is correct. Do not compress it to look tidy; Phase 14 reads
it as a checklist.

## Deliberate deviations

None. This phase changes nothing.

## Exit criteria

- [ ] `docs/migration/00-current-state.md` exists with all 19 sections
- [ ] Every count in the self-consistency list independently confirmed, or the
      checklist corrected with an explanation
- [ ] `docs/migration/feature-parity-checklist.md` verified line by line, with
      corrections applied and listed in the report
- [ ] 250 baseline screenshots committed
- [ ] `tools/capture-legacy-baseline.mjs` re-runnable and deterministic
- [ ] All three legacy test suites run, results recorded verbatim
- [ ] Documentation drift section names every stale claim found
- [ ] `git status` shows no modification to any legacy application file
- [ ] `docs/migration/phase-00-report.md` written
