# Phase 12 prompt — Parent centre, custom words, recordings and rewards

Plan: [../phases/phase-12-plan.md](../phases/phase-12-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 12 of the Talki migration to Expo React Native.

Phase 12 builds the adult side of Talki — settings, recordings, custom words,
the progress report and the method explanation — plus the child-facing stickers
screen. After this phase, every feature in the parity checklist exists.

Execute ONLY Phase 12.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Recording and photo capture are native-only; do not let
  a green Playwright run stand in for native evidence.

FORBIDDEN
- No adult control on any child screen.
- No strengthening the parent gate into real security. See below.
- No reset that touches recordings or custom words.
- No direct expo-* import from a screen. Services only.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not add AdMob. Phase 13.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-12-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-12-plan.md   — your plan, read it fully
2. docs/migration/validation.md
3. docs/migration/phase-03-report.md        — BackupService, which you now expose
4. docs/migration/phase-11-report.md
5. index.html:
     1754-1799  exportBackup / importBackup
     1831-1834  allCats() and the virtual 'mine' category
     1888-1987  say() — recordings take precedence over TTS
     2098-2100  re-lock on leaving the parent view
     2272-2276  catPicker() — the one adult control legacy allows, on the
                parent recording screen, which is itself adult UI
     2417-2473  STICKERS, stickerUnlocked(), renderStickers()
     3220-3229  renderParent() and the five tabs
     3230-3247  renderLock() gate maths and keypad
     3248-3295  parentSettings()
     3288       the privacy policy link
     3296-3318  parentRecord()
     3319-3342  parentWords()
     3343-3357  parentMethod()
     3358-3376  parentReport()
     3764-3772  keypad handling, wrong answer
     3919-3957  recording capture, 4s cap
     3921-3927  preloadRecs()
     4050-4058  the 900ms hold entry

GROUND TRUTH

THE GATE IS A BARRIER TO A TODDLER, NOT TO AN ATTACKER.
    entry     a 900 ms HOLD on the parent button (4050-4058). A short tap only
              toasts and does not open.
    question  a = 3 + floor(random*7)  -> 3..9
              b = 2 + floor(random*8)  -> 2..9
              the answer is a * b
    keypad    1-9, clear, 0, OK
    wrong     does not unlock
    leaving   RE-LOCKS (2098-2100)

    Do NOT strengthen this into real security. It exists so a two-year-old
    mashing the screen cannot reach adult settings, and so a parent is never
    locked out of their own app. A hold plus simple arithmetic is exactly
    calibrated to that. The re-lock matters: a parent handing the tablet back
    must not be handing over an unlocked settings screen.

FIVE TABS (3221): settings, record, words, report, method

SETTINGS (3248-3295)
    rate      0.6 / 0.85 / 1
    musicVol  0.25 / 0.5 / 0.85
    toggles   niqqud, sounds, effects, music, voice
    plus      progress reset, backup export, backup import, privacy policy link

PROGRESS RESET IS PRECISE ABOUT WHAT IT DESTROYS:
    CLEARS      lia:progress, lia:stats, lia:lastcat
    DOES NOT    lia:rec:*        (parent voice recordings)
    CLEAR       lia:custom:*     (custom words)

    A parent resetting progress wants a fresh start for the child, not to
    destroy an hour of recording their own voice. Getting this wrong is
    UNRECOVERABLE. The confirmation must say exactly what will and will not be
    deleted, and you must test the KEEP case, not just the delete case.

CUSTOM WORDS (1831-1834, 3319-3342)
    shape    { id, word, emoji, photo }
    stored   lia:custom:<id>, indexed by lia:custom:index
    photo    320x320 JPEG
    surfaced through the virtual 'mine' category by allCats()
    They participate in games exactly like built-in words: totalWords() counts
    them and MIN_ITEMS applies. This is why 'mine' has been carried through
    every earlier phase rather than bolted on here.

RECORDINGS (3296-3318, 3919-3957)
    per word, capped at 4000 ms, organised BY CATEGORY
    preloadRecs(catId) loads lazily per category — keep it lazy, it matters
    once a family has recorded a hundred words
    say() PREFERS a recording over TTS. A parent recording their own voice is
    the single highest-value feature for a child with a speech delay: a
    familiar voice, correct pronunciation, natural prosody.

REPORT (3358-3376)
    per-category progress, and the TOP 10 HARDEST WORDS by stats.wrong

STICKERS (2417-2473)
    24 stickers, three unlock kinds:
      milestone  learned.size >= 1 / 25 / 75
      complete   the numbers category fully learned
      word       learned.has(key(cat, word))
    filter chips: 'all' plus each category present in STICKERS
    counter: "N מתוך 24 מדבקות נאספו"
    LOCKED STICKERS RENDER GREYED, NOT HIDDEN

BACKUP: Phase 3 already built and tested BackupService. This is where it gets a
screen. The import screen MUST state clearly that 'replace' deletes existing
data. Display settings.lastBackup.

WORK ITEMS

1. Build the parent gate: a 900 ms long-press that FAILS if movement exceeds a
   small threshold, so a scroll beginning on the button does not open it.

2. Build the five tabs and the stickers screen exactly to the ground truth.

3. Photo capture with expo-image-picker, resized to 320x320 JPEG on device,
   handling denial gracefully. Adding a camera permission to a children's app
   deserves an explicit note in your report.

4. Expose BackupService: export to a file, import with a merge-or-replace
   choice, display lastBackup.

5. Add every testId from the plan to src/testing/testIds.ts.

6. Tier 1 tests per the plan. THE MOST IMPORTANT ONE:

   progress-reset.test.ts
     - clears lia:progress, lia:stats and lia:lastcat
     - does NOT clear lia:rec:*
     - does NOT clear lia:custom:*
   An error here destroys user data irreversibly. Write it first.

   parent-gate.test.ts
     - a is always 3..9 and b always 2..9 across many generations
     - the correct product unlocks; a wrong answer does not
     - clear empties the input
     - leaving re-locks
     - a short tap does not unlock

   custom-words.test.ts
     - CRUD round-trips through storage; the index stays consistent after delete
     - a custom word appears in allCats() under 'mine'
     - totalWords() includes it
     - a photo is stored and retrieved intact
     - a custom word can be used in a game when MIN_ITEMS is satisfied

   stickers.test.ts
     - all 24 present
     - milestones unlock at exactly 1, 25 and 75
     - the 'complete' sticker unlocks only when numbers is fully learned
     - word stickers unlock on the exact key(cat, word)
     - the counter reports unlocked out of 24
     - filter chips are 'all' plus each category present in STICKERS

7. Tier 2: parent.spec.ts and stickers.spec.ts at all ten viewports, per the
   plan. Include: a short tap does NOT open the gate, a 900 ms hold does, a
   wrong answer does not unlock, navigating away and back re-locks, the reset
   confirmation states what is kept and deleted, and the import screen states
   that replace deletes existing data.

8. Tier 3: apps/mobile/.maestro/parent.yaml, plus manual attestation with the
   device named:
     - the 900 ms hold works with an adult finger and is NOT triggered by a
       toddler tap
     - recording captures real audio, caps at 4 s, plays back
     - a recorded word is used INSTEAD OF TTS in a game
     - photo capture and selection produce a usable 320x320 JPEG
     - microphone and camera permission denial handled
     - export writes a file the OS can share
     - import from a real file works
     - reset keeps recordings and custom words, verified by inspection

9. Run the gate:
      cd apps/mobile
      npx tsc --noEmit && npx eslint . && npx expo-doctor
      npx vitest run
      npx expo export --platform web
      npx playwright test
    Then from the repository root:
      node tools/dev-server.js &
      BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
      BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
      node --test tests/audio-logic.test.js

DO NOT
- Do not add AdMob.
- Do not make the parent gate a real password or PIN.
- Do not let reset touch recordings or custom words.
- Do not load every recording on mount.
- Do not hide locked stickers; grey them.
- Do not put any adult control on a child screen.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] A 900 ms hold opens the gate; a short tap only toasts
- [ ] A scroll starting on the button does not open the gate
- [ ] Gate maths a in 3..9, b in 2..9; a wrong answer does not unlock
- [ ] Leaving the parent view re-locks it
- [ ] All five tabs work
- [ ] Every setting persists and takes effect
- [ ] Rate options 0.6 / 0.85 / 1; music volume 0.25 / 0.5 / 0.85
- [ ] Reset clears lia:progress, lia:stats and lia:lastcat
- [ ] Reset does NOT clear lia:rec:* or lia:custom:*, asserted by test
- [ ] The reset confirmation states exactly what is kept and what is deleted
- [ ] Report shows per-category progress and the top 10 hardest words by wrong
- [ ] Custom word CRUD works with a 320x320 JPEG photo
- [ ] Custom words appear in 'mine' and count in totalWords()
- [ ] A custom word is usable in a game
- [ ] Recording captures, caps at 4000 ms, organised by category
- [ ] A recording takes precedence over TTS, verified on a device
- [ ] preloadRecs stays per-category lazy
- [ ] Backup export and import work with the Phase 3 fixture
- [ ] The import screen states that replace deletes existing data
- [ ] settings.lastBackup is displayed
- [ ] 24 stickers with all three unlock kinds
- [ ] Locked stickers greyed, not hidden
- [ ] Filter chips and the "N of 24" counter correct
- [ ] The privacy policy link is present
- [ ] No adult control leaked onto a child screen
- [ ] Audits clean at all ten viewports
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 100 screenshots plus two device captures committed
- [ ] Recording, photo capture and permission denial attested on a device
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-12-report.md using the headings in
docs/migration/validation.md section 7.

Add a section "Data safety" showing the exact reset behaviour and the test that
proves recordings and custom words survive it.

Note explicitly which new permissions the app now requests and why.

Then stop. Do not begin Phase 13.
````
