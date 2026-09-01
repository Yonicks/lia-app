# Phase 0 prompt — Freeze and audit the migration baseline

Plan: [../phases/phase-00-plan.md](../phases/phase-00-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 0 of the Talki migration from a vanilla-JS / Capacitor
web app to a native Expo React Native app.

Phase 0 writes documentation and one capture script. It changes NO application
behaviour and NO application code.

Execute ONLY Phase 0. Do not create the Expo app. Do not start Phase 1.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary. docs/talki-home-redesign-audit.md and the
  redesign plans are known to contain claims that the live code has moved past.
  Where a document and the code disagree, the code wins and you record the drift.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename, restructure or refactor index.html, audio-manager.js,
  assets/, tools/, tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not remove Capacitor. Do not modify the existing npm scripts.
- Do not edit legacy source to make a new test pass. If legacy behaviour looks
  wrong, record it as a finding and preserve it anyway.
- The legacy test suites must still pass at the end of your phase.

FORBIDDEN
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- If you finish early, deepen the audit. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- Do not silently pick a direction on a decision the plan did not make.
- The phase plan lists open questions with a suggested default. Use the default,
  and record in your report that you did and why.

REPORTING
- Write docs/migration/phase-00-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL. Never "mostly" or "should
  work". If you did not verify it, the answer is FAIL with a reason.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-00-plan.md          — your plan, read it fully
2. docs/migration/validation.md                    — the gate
3. docs/migration/feature-parity-checklist.md      — the seeded inventory you verify
4. Talki — React Native - Expo Migration Master Plan.md, sections 2 and 14

THEN INSPECT, IN THIS ORDER
- index.html                       (4307 lines — read it all, not just greps)
- audio-manager.js
- assets/audio/audio-logic.js
- capacitor.config.ts
- manifest.json
- sw.js
- package.json
- .github/workflows/test-and-deploy.yml
- tests/test_suite.py
- tests/interaction_suite.py
- tests/audio-logic.test.js
- tests/word-speak-playwright.mjs
- tools/*.js, tools/*.mjs, tools/*.py
- README.md
- docs/talki-home-redesign-audit.md
- docs/talki-home-redesign-plan.md
- docs/talki-home-redesign-cursor-plan.md
- docs/talki-home-missing-assets.md
- docs/design/ and docs/art-direction/

GROUND TRUTH — verify each of these independently and report agreement or
correction. Count programmatically; a throwaway script in /tmp is fine, but do
not add a counting script to the repository.

- 23 view identifiers in the views map inside render()      index.html 2085-2092
- 11 game ids reachable via startGame()                     index.html 2491-2551
- 6 entries in PRACTICE_LIST                                index.html 2218-2225
- 10 built-in categories in CATEGORIES                      index.html 1480-1592
- 182 built-in words total, split:
    animals 26, food 26, colors 26, home 26, outside 18,
    actions 16, family 12, body 12, numbers 10, emotions 10
- 24 entries in STICKERS                                    index.html 2417-2442
- 7 key patterns on K                                       index.html 1633-1637
    lia:progress, lia:settings, lia:stats, lia:custom:index,
    lia:custom:<id>, lia:rec:<key>, lia:lastcat
- 16 entries in MIN_ITEMS                                   index.html 2489-2490
- 22 keys in SFX_FILES                                      assets/audio/audio-logic.js
- 10 keys in MUSIC_FILES                                    assets/audio/audio-logic.js

Four things the previous version of the master plan got WRONG. Confirm the
corrected version against the code and report what you find:

  a) currentCategory() (index.html 2206-2216) has FOUR steps, and step 1 is
     "if lastCat is set and that category is not fully learned, return it".
  b) There are SEVEN storage keys, not six. lia:lastcat is the extra one.
  c) importBackup() (index.html 1781) accepts app === 'talki' OR
     app === 'lia-words', and supports 'merge' and 'replace' modes.
  d) settings gains lastBackup (1771) and puzzleLevel (2973-2978) at runtime,
     neither of which appears in the defaults literal at 1647.

WORK ITEMS

1. Write docs/migration/00-current-state.md with exactly these 19 sections, in
   this order. Every factual claim carries an index.html line reference.

   1  Provenance — commit SHA, date, files inspected with line counts
   2  Application shape — entry, start gate, render loop, navigation, history
   3  Views — all 23, render function, line range, how each is reached
   4  Games — all 11: setup, render, handlers, round logic, completion,
      score/streak, stats effects, audio calls, MIN_ITEMS, category rules
   5  Practice modes — all 6, described in terms of the clinical mechanic each
      one implements, not just its UI
   6  Vocabulary — categories, exact counts, item shape, art() path rules
      including the colors exception, the virtual 'mine' category
   7  Progress — key(), points, totalWords(), catLearned(), currentCategory()
      all four branches, lastCat write points, STAR_STEP, celebrate()
   8  Persistence — the three Store backends and their order, all 7 keys with
      exact value shapes, what happens when each backend is unavailable
   9  Settings — defaults, the two runtime keys, and which UI control writes each
   10 Backup — exact schema, both accepted app names, both modes, every error path
   11 Audio — music states, all 22 SFX events, ducking table with exact numbers,
      cooldowns, MAX_SIMULTANEOUS_SFX, NEVER_COMBINE, crossfade, lifecycle,
      and the split between pure audio-logic.js and DOM-bound audio-manager.js
   12 Voice — say() resolution order, TTS parameters, the core flag, recording
      capture and storage, both recognition entry points, degraded behaviour
   13 Rewards — all 24 stickers, the three unlock kinds, filter chips, counter
   14 Parent area — 900ms hold entry, gate maths, all 5 tabs, re-lock, reset
   15 Platform — Capacitor plugins, AdMob config, PWA, sw.js caching, wake lock,
      the portrait orientation lock, offline behaviour
   16 Tests and CI — what each suite covers, what runs in CI, what does not
   17 Documentation drift — EVERY claim in docs/ that the code contradicts,
      with the document, the claim, and the correct value
   18 Defects found
   19 Migration risks

2. Verify docs/migration/feature-parity-checklist.md line by line against the
   code. Correct any row that is wrong. List every correction in your report.
   Do not change the Status column; every row stays TODO.

3. Create tools/capture-legacy-baseline.mjs.

   It launches Chromium via Playwright once, and for each of these 10 viewports:
     320x568  360x800  390x844  430x932  768x1024
     834x1112 844x390  932x430  1024x768 1280x800
   captures every one of the 23 views plus 'parent-locked' and
   'category-animals', writing:
     docs/migration/screenshots/legacy-baseline/<W>x<H>-<view>.png

   Requirements:
   - BASE_URL env var, default http://localhost:8000
   - one browser launch, one context per viewport, not one process per shot
   - dismiss #gateBtn if present
   - navigate by setting state through page.evaluate(), following the pattern in
     tools/sweep.js. For game and practice views call launch(type,'animals');
     for static views set view directly and call render().
   - seed a FIXED set of learned words before capturing so star counts and
     progress bars are identical on every run
   - viewports narrower than 900px get hasTouch and isMobile true
   - print a per-view pass/fail line and exit 1 if any capture failed
   - no absolute paths outside the repository
   - if you document a CLI flag, implement it

   Run it. Commit the output.

4. Run all three legacy suites and record the output verbatim:
     node tools/dev-server.js &
     BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
     BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
     node --test tests/audio-logic.test.js
   If a suite is already failing, that is the inherited baseline. Record it.
   Do not fix it.

5. Confirm you changed nothing you should not have:
     git status --porcelain
   The only changes may be additions under docs/migration/ and the new
   tools/capture-legacy-baseline.mjs. If anything else appears, revert it.

DO NOT
- Do not create apps/mobile or install any Expo dependency.
- Do not fix any defect you find, including the prepare_www.js / audio-manager.js
  omission. Record it and move on.
- Do not summarise the existing docs/ documents as if they were fact.
- Do not shorten 00-current-state.md to make it tidy. Length is expected.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] 00-current-state.md exists with all 19 sections, every claim line-referenced
- [ ] All 11 ground-truth counts independently verified, agreements and
      corrections both reported
- [ ] Corrections (a) through (d) each confirmed against the code
- [ ] feature-parity-checklist.md verified row by row, corrections listed
- [ ] tools/capture-legacy-baseline.mjs exists, is deterministic, and exits
      non-zero on failure
- [ ] 250 baseline screenshots committed under
      docs/migration/screenshots/legacy-baseline/
- [ ] All three legacy suites run, output pasted verbatim
- [ ] git status shows no modification to any legacy application file
- [ ] Section 17 names every documentation claim contradicted by the code

REPORT
Write docs/migration/phase-00-report.md using the headings in
docs/migration/validation.md section 7. For gate items 1 through 5, write
"not applicable, no mobile app exists in Phase 0". Gate item 6 is the legacy
suite output. The native-coverage section is "not applicable, no native surface".

Then stop. Do not begin Phase 1.
````
