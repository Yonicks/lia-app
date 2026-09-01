# Phase 12 — Parent centre, custom words, recordings and rewards

**Prompt:** [../prompts/phase-12.md](../prompts/phase-12.md)
**Creates:** `src/features/parent/`, `src/features/rewards/`
**Ships:** the last unbuilt feature area

---

## Goal and rationale

Build the adult side of Talki — settings, recordings, custom words, the
progress report, the method explanation — plus the child-facing stickers
screen.

This phase is where the parent finally gets control of the app: speech rate,
audio, niqqud, their own voice recordings, their child's own words, and their
backup. It is also where the migration's storage and audio work becomes visible
to a user for the first time.

After this phase, every feature in the feature-parity checklist exists.

## Entry conditions

- `docs/migration/phase-11-report.md` exists with no critical FAIL.
- Storage, backup, recording and audio services all work.

## Design decisions

### The gate is a barrier to a toddler, not to an attacker

Entry is a 900 ms hold on the parent button (index.html 4050-4058); a short tap
only toasts. Then a multiplication question with `a` in 3-9 and `b` in 2-9
(index.html 3232-3233), answered on a numeric keypad.

This is not security and should not be strengthened into security. It exists so
a two-year-old mashing the screen cannot reach adult settings, and so a parent
is not locked out of their own app. A hold plus simple arithmetic is exactly
calibrated to that.

Leaving the parent view re-locks it (index.html 2098-2100). That matters: a
parent who hands the tablet back must not hand over an unlocked settings
screen.

### No adult control ever appears on a child screen

Already established in Phase 7 and reinforced here. Every control built in this
phase lives behind the gate. The one exception legacy allows is `catPicker()`
(index.html 2272-2276), used on the parent recording screen, which is itself
adult UI.

### Custom words reuse the word contract

A custom word is `{ id, word, emoji, photo }` stored at `lia:custom:<id>`, with
an index at `lia:custom:index`, surfaced through the virtual `mine` category by
`allCats()` (index.html 1831-1834).

Photos are 320x320 JPEG. Phase 3 measured whether they belong in the KV store;
follow that decision. Custom words participate in games exactly like built-in
words — `totalWords()` counts them and `MIN_ITEMS` applies — which is why the
`mine` category has been carried through every earlier phase rather than bolted
on here.

### Recordings replace TTS, which is the point

`say()` prefers a parent recording over TTS (index.html 1888-1987). A parent
recording their own voice is the single highest-value feature for a child with
a speech delay: a familiar voice, correct pronunciation, natural prosody.

The recording UI is organised by category and shows which words already have a
recording. `preloadRecs(catId)` (index.html 3921-3927) loads lazily per
category, which matters once a family has recorded a hundred words.

### Progress reset is precise about what it destroys

Reset clears learned words, stats and `lastCat`. It does **not** clear
recordings or custom words.

A parent resetting progress wants a fresh start for the child, not to destroy
an hour of recording their own voice. Getting this wrong is unrecoverable and
the confirmation dialogue must say exactly what will and will not be deleted.

### Backup UI, finally

Phase 3 built and tested `BackupService`. This is where it gets a screen:
export to a file, import with a merge-or-replace choice, and display
`settings.lastBackup`.

The import screen must state clearly that `replace` deletes existing data.

## Legacy source mapping

| Behaviour | Legacy location |
|---|---|
| 900 ms hold entry, short tap toasts | index.html 4050-4058 |
| `renderParent()` and the five tabs | index.html 3220-3229 |
| `renderLock()` gate maths and keypad | index.html 3230-3247 |
| Re-lock on leaving | index.html 2098-2100 |
| Keypad handling, wrong answer | index.html 3764-3772 |
| `parentSettings()` | index.html 3248-3295 |
| `parentRecord()` | index.html 3296-3318 |
| `parentWords()` | index.html 3319-3342 |
| `parentMethod()` | index.html 3343-3357 |
| `parentReport()` | index.html 3358-3376 |
| `catPicker()` | index.html 2272-2276 |
| Custom word storage | index.html 1831-1834 |
| Recording capture, 4 s cap | index.html 3919-3957 |
| `preloadRecs()` | index.html 3921-3927 |
| `STICKERS`, `stickerUnlocked()` | index.html 2417-2447 |
| `renderStickers()` | index.html 2449-2473 |
| Privacy policy link | index.html 3288 |
| `exportBackup` / `importBackup` | index.html 1754-1799 |

## Files to be created

```
apps/mobile/src/features/parent/
├── ParentGateScreen.tsx        900ms hold plus maths keypad
├── ParentScreen.tsx            tab host
├── useParentLock.ts            unlock state, re-lock on leave
├── tabs/
│   ├── SettingsTab.tsx
│   ├── RecordTab.tsx
│   ├── WordsTab.tsx
│   ├── ReportTab.tsx
│   └── MethodTab.tsx
└── components/
    ├── RecordButton.tsx
    ├── CustomWordForm.tsx
    ├── PhotoPicker.tsx         320x320 JPEG
    └── BackupPanel.tsx

apps/mobile/src/features/rewards/
├── StickersScreen.tsx
├── StickerGrid.tsx
└── StickerFilters.tsx

apps/mobile/tests/unit/
├── parent-gate.test.ts
├── custom-words.test.ts
├── progress-reset.test.ts
└── stickers.test.ts

apps/mobile/tests/e2e/parent.spec.ts
apps/mobile/tests/e2e/stickers.spec.ts
apps/mobile/.maestro/parent.yaml
```

## testIds introduced

```
parent-button                    parent-gate-question
parent-gate-key-<n>              parent-gate-clear
parent-gate-ok                   parent-gate-back
parent-tab-<tabId>

parent-settings-rate-<value>     parent-settings-niqqud
parent-settings-sounds           parent-settings-effects
parent-settings-music            parent-settings-musicvol-<value>
parent-settings-voice
parent-settings-reset            parent-settings-reset-confirm
parent-settings-export           parent-settings-import
parent-settings-import-merge     parent-settings-import-replace
parent-settings-lastbackup

parent-record-category           parent-record-word-<index>
parent-record-start              parent-record-stop
parent-record-play               parent-record-delete

parent-words-add                 parent-words-input
parent-words-photo               parent-words-save
parent-words-item-<id>           parent-words-delete-<id>

parent-report-category-<id>      parent-report-hard-<index>

stickers-root                    stickers-filter-<key>
stickers-item-<index>            stickers-counter
```

## Behaviour to preserve exactly

- 900 ms hold to enter; a short tap toasts and does not open.
- Gate question: `a` in 3-9, `b` in 2-9, product answer.
- Keypad 0-9, clear, OK. A wrong answer does not unlock.
- Leaving the parent view re-locks it.
- Five tabs: settings, record, words, report, method.
- Rate options 0.6 / 0.85 / 1.
- Music volume options 0.25 / 0.5 / 0.85.
- Toggles for niqqud, sounds, effects, music, voice.
- Reset clears learned, stats and `lastCat`; keeps recordings and custom words.
- Report shows per-category progress and the top 10 hardest words by
  `stats.wrong`.
- Custom words are `{ id, word, emoji, photo }` with a 320x320 JPEG.
- Custom words appear in the `mine` category and count in `totalWords()`.
- Recordings are per word, capped at 4 s, organised by category.
- A recording takes precedence over TTS.
- Stickers: 24, three unlock kinds, filter chips, "N of 24 collected".
- Locked stickers render greyed, not hidden.
- The privacy policy link is present.

## Test plan

### Tier 1

`parent-gate.test.ts`
- `a` is always 3-9 and `b` always 2-9 across many generations
- the correct product unlocks; a wrong answer does not
- clear empties the input
- leaving re-locks
- a short tap does not unlock

`custom-words.test.ts`
- create, read, update and delete round-trip through storage
- the index stays consistent after a delete
- a custom word appears in `allCats()` under `mine`
- `totalWords()` includes it
- a photo is stored and retrieved intact
- a custom word can be used in a game when `MIN_ITEMS` is satisfied

`progress-reset.test.ts`
- clears `lia:progress`, `lia:stats` and `lia:lastcat`
- does **not** clear `lia:rec:*`
- does **not** clear `lia:custom:*`
- this is the single most important test in the phase; an error here destroys
  user data irreversibly

`stickers.test.ts`
- all 24 present
- milestone unlocks at exactly 1, 25 and 75 learned words
- the `complete` sticker unlocks only when the numbers category is fully learned
- word stickers unlock on the exact `key(cat, word)`
- the counter reports unlocked out of 24
- filter chips include `all` plus each category present in `STICKERS`

### Tier 2

`parent.spec.ts` at all ten viewports
- a short tap on the parent button does not open the gate
- a 900 ms hold does
- a wrong answer does not unlock; a correct one does
- all five tabs render
- every settings control changes the stored setting
- the reset confirmation states what is kept and what is deleted
- export produces a file; import accepts the Phase 3 fixture
- the import screen states that `replace` deletes existing data
- navigating away and back re-locks
- audits clean at every tab

`stickers.spec.ts` at all ten viewports
- 24 stickers render, locked ones greyed rather than hidden
- filter chips filter correctly
- the counter is accurate
- with seeded progress, the expected stickers are unlocked
- `toHaveScreenshot()` and `captureMatrix` per state

### Tier 3

Recording and photo capture are native-only.

`.maestro/parent.yaml`: hold, unlock, open each tab, return.

Manual attestation, device named:
- the 900 ms hold works with an adult finger and is not triggered by a toddler
  tap
- recording captures real audio, caps at 4 s, plays back
- a recorded word is used instead of TTS in a game
- photo capture and selection produce a usable 320x320 JPEG
- microphone and camera permission denial are handled
- export writes a file the OS can share
- import from a real file works
- reset keeps recordings and custom words, verified by inspection

## Screenshot manifest

```
docs/migration/screenshots/phase-12/
    <viewport>-parent-gate.png
    <viewport>-parent-settings.png
    <viewport>-parent-record.png
    <viewport>-parent-words.png
    <viewport>-parent-report.png
    <viewport>-parent-method.png
    <viewport>-parent-reset-confirm.png
    <viewport>-stickers-all.png
    <viewport>-stickers-filtered.png
    <viewport>-stickers-progressed.png
    android-device-parent-record.png
    android-device-photo-picker.png
```

Ten states times ten viewports is 100 files, plus two device captures.

## Risks and open questions

**A 900 ms hold conflicting with a scroll gesture.** Default: use a long-press
recogniser that fails if movement exceeds a small threshold, so a scroll that
begins on the button does not open the gate.

**Photo capture is a new permission.** Default: `expo-image-picker`, resize to
320x320 JPEG on device, handle denial gracefully. Adding a camera permission to
a children's app deserves an explicit note in the report.

**Recording list performance with many recordings.** Default: keep
`preloadRecs(catId)` per-category lazy loading. Do not load every recording on
mount.

**Reset is destructive and irreversible.** Default: a confirmation that names
exactly what will be deleted and what will be kept. Test the keep case, not
just the delete case.

**The parent area is adult UI in a child's app.** Default: it may use standard
controls and denser layout, but it stays inside the Talki design system.
Touch-target rules still apply — a parent uses this one-handed while holding a
child.

## Exit criteria

- [ ] 900 ms hold opens the gate; a short tap only toasts
- [ ] Gate maths `a` 3-9, `b` 2-9; a wrong answer does not unlock
- [ ] Leaving re-locks, verified in Tier 2
- [ ] All five tabs work
- [ ] Every setting persists and takes effect
- [ ] Rate options 0.6 / 0.85 / 1; music volume 0.25 / 0.5 / 0.85
- [ ] Reset clears learned, stats and `lastCat`
- [ ] Reset does NOT clear recordings or custom words, asserted by test
- [ ] The reset confirmation states exactly what is kept and deleted
- [ ] Report shows per-category progress and the top 10 hardest words
- [ ] Custom word CRUD works with a 320x320 JPEG photo
- [ ] Custom words appear in `mine` and count in `totalWords()`
- [ ] Recording capture works, caps at 4 s, is organised by category
- [ ] A recording takes precedence over TTS, verified on a device
- [ ] `preloadRecs` stays per-category lazy
- [ ] Backup export and import work, with the fixture from Phase 3
- [ ] The import screen states that replace deletes existing data
- [ ] `settings.lastBackup` is displayed
- [ ] 24 stickers, three unlock kinds, filters, counter, greyed locked state
- [ ] The privacy policy link is present
- [ ] No adult control leaked onto a child screen
- [ ] Audits clean at all ten viewports
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 100 screenshots plus two device captures committed
- [ ] Recording, photo and permission denial attested on a device
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-12-report.md` written
