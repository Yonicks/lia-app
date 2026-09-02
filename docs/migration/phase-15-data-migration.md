# Phase 15 data migration

A user updating from Capacitor Talki to Expo Talki must not lose the
child's progress or the parent's voice recordings.

The two apps do not share storage. Capacitor keeps a KV store (IndexedDB
`lia-words` / `kv`) inside a WebView. Expo uses SQLite plus files on
disk. There is **no automatic path**.

This document is the procedure. It has **not** been run on a device in
this phase — Phase 14 was NO-GO.

## Chosen option: backup and restore (option 1)

Options considered:

1. **Backup and restore (chosen).** Capacitor already exports a V1
   payload (`index.html` 1754–1775). Expo already imports it, including
   `app === "lia-words"` (`BackupService`, `backup-import.test.ts`).
2. One-time IndexedDB read inside the native app. Possible on Android,
   unreliable on iOS, and it ships WebView code into Expo. Rejected.
3. Accept the loss. **Not acceptable** for recordings.

## Payload (must stay V1)

```
{
  app: "talki" | "lia-words",
  version: 1,
  exported_at: ISO string,
  word_count: number,          // learned.size
  data: { [storageKey]: value } // every Store key verbatim
}
```

Keys that must survive:

| Key | Why it matters |
|---|---|
| `lia:progress` | learned words / points |
| `lia:settings` | rate, niqqud, audio toggles, puzzleLevel, lastBackup |
| `lia:stats` | SRS-lite wrong/seen |
| `lia:lastcat` | continue-learning hero |
| `lia:custom:index` + `lia:custom:<id>` | family words |
| `lia:rec:<catId:word>` | parent recordings as data URLs at the export boundary |

Native stores recordings as files. The export/import boundary is still a
data URL, per phase-03-plan.md.

## Parent-facing wording

### Capacitor (final store release, not shipped here)

Show before the user leaves the old app:

> לפני העדכון: שמרו גיבוי. הקובץ כולל את ההתקדמות, המילים האישיות וכל
> ההקלטות של ההורים. בלי הקובץ אי אפשר להעביר אותן לאפליקציה החדשה.

Settings already has export. The final Capacitor release should make
that button impossible to miss. This phase does **not** change
`index.html`.

### Expo (already in Settings)

`BackupPanel` copy today:

> הכול נשמר על המכשיר הזה בלבד. קובץ גיבוי אחד מכיל את ההתקדמות,
> ההגדרות, המילים האישיות וכל ההקלטות.

Import modes:

- מיזוג מוסיף לקיים
- החלפה מוחקת הכול קודם

First-run of the native app should offer import before the child starts
a new empty profile. That first-run prompt is **not** built — log it as
work that Stage 1 still owes when Phase 14 is GO. Until then, import
lives on the parent Settings tab (behind the 900 ms hold + gate).

## Verification procedure (Stage 2, on a named device)

1. On Capacitor Talki, record at least two parent voices, learn at least
   five words, add one custom word.
2. Export. Confirm filename `talki-backup-YYYY-MM-DD.json` and that
   `data` contains `lia:progress`, `lia:custom:*`, and `lia:rec:*`.
3. Install Expo Talki (`com.yonicks.talki` or `.dev`) **alongside**, do
   not overwrite yet.
4. Hold the brand 900 ms, unlock the gate, Settings → import → replace.
5. Confirm: same learned set, same custom word, both recordings play
   through `say()`, `lastCat` hero matches, settings (niqqud, rate)
   match.
6. Repeat with **merge** on a second device that already has different
   progress: progress unions; other keys overwrite.

Until this loop has been signed by a real parent on named hardware, Stage
3 must not start.

## What this phase did not do

- No Capacitor in-app “export before update” prompt (would touch
  `index.html`).
- No Expo first-run import interstitial.
- No device verification of the loop.
