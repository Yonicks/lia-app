# Phase 3 prompt — Native persistence and legacy backup compatibility

Plan: [../phases/phase-03-plan.md](../phases/phase-03-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 3 of the Talki migration to Expo React Native.

Phase 3 replaces IndexedDB with native persistence WITHOUT changing anything
about what Talki stores or what a backup file looks like. It builds no UI; the
parent-facing backup screen is Phase 12.

Execute ONLY Phase 3.

This phase carries the migration's only irreversible risk. A rendering bug is
visible and fixable. A storage bug silently drops a child's progress, or makes
an existing user's backup file unimportable, and that file is their only copy.
Change the technology. Change nothing about the data.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename, restructure or refactor index.html, audio-manager.js,
  assets/, tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not edit legacy source to make a new test pass.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Do not make a decision for the browser's benefit.
- A web storage backend exists so Playwright can run. It must never be selected
  on a native platform, and there is a test asserting that.

FORBIDDEN
- No direct expo-sqlite import from any screen, game or domain module.
  Everything goes through the TalkiStorage interface.
- No renaming of the lia: key prefix.
- No new backup version.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not build the parent screen, the backup UI or any settings UI.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-03-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
- State plainly which findings are web-only and not proof of native behaviour.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-03-plan.md   — your plan, read it fully
2. docs/migration/validation.md             — sections 2, 4 and 6
3. docs/migration/phase-02-report.md        — the domain layer you build on
4. docs/migration/00-current-state.md       — section 8 persistence, 10 backup
5. index.html:
     1633-1637   K key definitions
     1662-1745   Store, three backends
     1747-1749   sGet / sSet / sDel
     1752        BACKUP_VERSION
     1754-1775   exportBackup()
     1777-1799   importBackup()
     1801-1810   loadAll()
     1823        enterCat() writing lia:lastcat
     3319-3342   custom word storage, 320x320 photo
     3919-3957   recording capture and storage
6. tests/test_suite.py, function test_storage — the export pattern you copy

GROUND TRUTH — do not deviate

SEVEN key patterns (index.html 1633-1637). Keep the lia: prefix. Do not rename:
    K.progress    = 'lia:progress'        string[] of "catId:word"
    K.settings    = 'lia:settings'        settings object
    K.stats       = 'lia:stats'           { [key]: { seen, wrong } }
    K.customIndex = 'lia:custom:index'    string[] of custom ids
    K.custom(id)  = 'lia:custom:' + id    { id, word, emoji, photo }
    K.rec(key)    = 'lia:rec:' + key      audio data URL string (legacy)
    K.lastcat     = 'lia:lastcat'         category id string

'lia' is the product's former name. Renaming to talki: is tempting and is
REJECTED: raw keys appear inside the backup file's data object, so a rename
means a translation layer on every import, which is a second place to be wrong.

Backup V1 export payload (index.html 1754-1775) — exactly these five fields:
    {
      app: 'talki',
      version: 1,
      exported_at: <ISO string>,
      word_count: <learned.size>,
      data: { <every Store key>: <value> }
    }
Export also sets settings.lastBackup and saves settings (index.html 1771).
Filename: talki-backup-YYYY-MM-DD.json

Backup V1 import (index.html 1777-1799):
    - The signature check accepts TWO app names:
        payload.app === 'talki' || payload.app === 'lia-words'
      'lia-words' is the former product name and appears in real user backups.
      Rejecting it breaks exactly the long-standing users this work protects.
    - Rejects a payload with no data, and unparseable JSON, WITHOUT throwing
      to the caller. Legacy toasts and returns.
    - TWO modes:
        'replace' deletes every existing key first
        'merge'   unions the lia:progress array through a Set, and OVERWRITES
                  every other key. It is not a deep merge.
    - After import: clear the recordings cache, reset learned/stats/custom,
      rehydrate.

BACKUP_VERSION stays 1. The schema has not changed, so the version must not.
Bumping it makes native-produced files unreadable by the legacy app during the
overlap when both are installed.

Two settings keys are written at runtime and are absent from the defaults
literal. Both MUST survive a round trip:
    lastBackup   ISO string   index.html 1771
    puzzleLevel  1..5         index.html 2973-2978

WORK ITEMS

1. Define the TalkiStorage interface in
   apps/mobile/src/services/storage/TalkiStorage.ts:

     export interface TalkiStorage {
       get<T>(key: string): Promise<T | null>;
       set<T>(key: string, value: T): Promise<void>;
       remove(key: string): Promise<void>;
       keys(): Promise<string[]>;
     }

   get() on a missing key returns null. Never undefined, never a throw.

   Implement sqliteKvStorage.ts over expo-sqlite/kv-store, and webStorage.ts
   over IndexedDB for the Playwright surface. index.ts selects by platform.
   Add a test asserting webStorage is never selected on a native platform.

   Port the seven key patterns into keys.ts exactly as above.

2. Move recordings to files on disk. This is the ONE deliberate change to the
   internal representation, and it is recorded as a deviation.

   Legacy stores each recording as a base64 data URL string. In SQLite that
   means megabytes of base64 in a KV table, read fully into memory on every
   access, with a ~33% encoding penalty.

   Natively:
     runtime          lia:rec:<key> -> a reference to a file on disk
     export boundary  lia:rec:<key> -> a data URL string
     import boundary  data URL -> write file -> store the reference

   The conversion lives ONLY in the backup service. Nothing else may know a
   recording was ever a data URL.

   Filenames: keys contain Hebrew and a colon (animals:כֶּלֶב). Colons are
   illegal in filenames on some platforms. Hash the key to produce the
   filename and keep the mapping in the KV value. Do NOT transliterate Hebrew
   into ASCII.

3. Implement BackupService with exportV1(), importV1(payload, mode) and
   validate(payload), following the contract in the plan. Confine all data-URL
   conversion here.

4. Write tools/capture-legacy-backup-fixture.mjs.

   It drives the RUNNING LEGACY APP with Playwright to produce
   docs/migration/fixtures/legacy-backup-v1.json:
     - seed progress across at least two categories
     - change at least two settings away from their defaults, including
       puzzleLevel
     - seed stats with non-zero seen and wrong values
     - add a custom word WITH a photo
     - add a recording for at least one word
     - trigger exportBackup() and capture the download
   Follow the export pattern already used by test_storage in
   tests/test_suite.py, which uses accept_downloads=True.

   A hand-written fixture tests your belief about the format. A generated one
   tests the format. If generating proves impractical, hand-construct it, mark
   it clearly as SYNTHETIC in the report, and raise it as a risk.

5. Write the five Tier 1 test files listed in the plan:
   storage.test.ts, backup-export.test.ts, backup-import.test.ts,
   backup-roundtrip.test.ts, recordings.test.ts.

   The import tests must include, at minimum:
     - the real generated fixture imports successfully
     - app: 'lia-words' imports successfully
     - app: 'something-else' is rejected with a reason
     - a payload with no data is rejected
     - unparseable JSON is rejected without throwing
     - replace mode clears pre-existing keys absent from the payload
     - merge mode UNIONS lia:progress rather than overwriting
     - merge mode OVERWRITES lia:settings rather than merging it
     - missing keys in the payload do not crash

   The round-trip test must prove puzzleLevel, lastBackup, custom word photos
   and exact stats values all survive.

   The recordings test must prove file -> data URL -> file is byte-identical,
   that an exported payload contains a data URL and not a file path, and that
   importing a legacy data URL produces a playable file.

6. Tier 3 — this phase needs real device proof. A web page reload is NOT a
   process kill, so SQLite durability cannot be shown on web.

   Write apps/mobile/.maestro/persistence.yaml:
     launch -> write a known value via a dev-only trigger -> stopApp ->
     relaunch -> assert the value is still present

   Then attest by hand, naming the device and OS version:
     - install, seed data, force-stop from Android settings, relaunch,
       data intact
     - import the real legacy fixture ON DEVICE and confirm the recording plays
     - seed a large recording set and confirm no crash

   If Maestro is unavailable, author the flow and attest manually. Say which.

7. Write docs/migration/phase-03-storage-report.md with real measurements:
   every key with its value type and representative size, a typical recording
   measured as file versus as data URL, import timing for the real fixture,
   storage footprint after import, and which validation paths each test covers.

8. Run the gate:
     cd apps/mobile
     npx tsc --noEmit
     npx eslint .
     npx expo-doctor
     npx vitest run
     npx expo export --platform web
     npx playwright test
   Then from the repository root:
     node tools/dev-server.js &
     BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
     BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
     node --test tests/audio-logic.test.js

DO NOT
- Do not build the parent area, the backup screen or any settings UI.
- Do not rename any storage key.
- Do not bump BACKUP_VERSION.
- Do not add a field to the export payload, not even a helpful one.
- Do not implement audio playback or recording capture. Phase 4 owns the
  recorder; you own where its output is stored.
- Do not "improve" the merge semantics. Union progress, overwrite the rest.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] TalkiStorage interface exists; no screen or domain module imports
      expo-sqlite directly
- [ ] All seven lia: keys preserved verbatim
- [ ] webStorage is never selected on a native platform, asserted by a test
- [ ] fixtures/legacy-backup-v1.json generated from the real legacy app,
      or marked SYNTHETIC with the risk recorded
- [ ] The real fixture imports successfully
- [ ] app: 'lia-words' accepted
- [ ] app: 'something-else' rejected with a reason
- [ ] Payload with no data rejected; unparseable JSON rejected without throwing
- [ ] replace mode clears pre-existing keys
- [ ] merge mode unions lia:progress and overwrites everything else
- [ ] Export payload has exactly the five V1 fields, no extras
- [ ] app === 'talki' and version === 1 on export
- [ ] word_count equals the learned-set size
- [ ] Export sets settings.lastBackup
- [ ] puzzleLevel and lastBackup survive a round trip
- [ ] Custom word photos survive a round trip
- [ ] Recordings stored as files, exported as data URLs, round-trip proven
      byte-identical
- [ ] Recording filenames are hashed, not transliterated
- [ ] Maestro persistence flow passes, OR manual force-stop attested with the
      device and OS version named
- [ ] The real fixture imported on-device and the recording played
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green
- [ ] expo export --platform web succeeds
- [ ] playwright test still green
- [ ] phase-03-storage-report.md written with real measurements
- [ ] No parent UI or backup screen was built
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-03-report.md using the headings in
docs/migration/validation.md section 7. For gate item 5, write "not applicable,
no UI in Phase 3 — substituted by phase-03-storage-report.md". The
native-coverage section MUST name a real device and OS version; this phase
cannot be validated on web alone.

Then stop. Do not begin Phase 4.
````
