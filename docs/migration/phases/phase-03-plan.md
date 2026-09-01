# Phase 3 — Native persistence and legacy backup compatibility

**Prompt:** [../prompts/phase-03.md](../prompts/phase-03.md)
**Creates:** `apps/mobile/src/services/storage/`, `src/services/backup/`,
`docs/migration/fixtures/legacy-backup-v1.json`
**Ships:** no UI. The parent-facing backup screen is Phase 12.

---

## Goal and rationale

Replace IndexedDB with native persistence without changing a single thing about
what Talki stores or what a backup file looks like.

This phase carries the migration's only irreversible risk. A rendering bug is
visible and fixable. A storage bug silently drops a child's progress, or worse,
makes an existing user's backup file unimportable — and that user has no
recourse, because the file on their device is the only copy.

So the shape of this phase is: change the storage technology, change nothing
about the data.

## Entry conditions

- `docs/migration/phase-02-report.md` exists with no critical FAIL.
- The domain layer exists, so `TalkiSettings`, `WordStats` and the key helpers
  are available.

## Design decisions

### Preserve the legacy key names verbatim

The seven `lia:` keys are carried over unchanged, prefix included.

`lia` is the product's former name. Renaming to `talki:` would be tidier and is
tempting. It is rejected because the backup file contains raw keys in its `data`
object, so a rename means every import needs a translation layer, and that
layer is a second place for the mapping to be wrong. The prefix is invisible to
users. Tidiness is not worth the risk here.

Rejected alternative: renaming with a migration shim. More code, more failure
modes, zero user-visible benefit.

### `expo-sqlite/kv-store` behind a `TalkiStorage` interface

Expo SQLite ships a persisted key/value API backed by SQLite. It is the closest
native analogue to what `Store` already provides: async get/set/delete/keys over
opaque values.

Everything goes through:

```ts
export interface TalkiStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}
```

No screen, no game and no domain module ever imports `expo-sqlite`. The legacy
`Store` already had three interchangeable backends behind one interface
(index.html 1662-1745), so this preserves an existing architectural property
rather than inventing one.

The interface also makes the web target work: on web the implementation can be
IndexedDB-backed, which is what Tier 2 exercises. That is a consequence of the
abstraction, not a reason for it.

Rejected alternative: a hand-rolled SQLite table with typed columns. It would
be faster to query, but nothing in Talki queries — every access is by exact key.
It would also break the "values are opaque" property the backup format depends
on.

### Recordings move to files on disk, and convert back at the export boundary

This is the one place the internal representation changes.

Legacy stores each parent recording as a base64 data URL string under
`lia:rec:<catId:word>`. In a browser with IndexedDB that is merely inefficient.
In SQLite it means megabytes of base64 in a key-value table, read fully into
memory on every access, with a roughly 33% size penalty from the encoding.

So natively a recording is a file, and the KV value becomes a reference to it.
But `exportBackup()` must still emit a data URL, because that is what backup
version 1 contains and what an existing user's file holds.

```
native runtime:   lia:rec:animals:כלב  ->  { uri: 'file:///.../rec_animals_כלב.m4a' }
export boundary:  lia:rec:animals:כלב  ->  'data:audio/m4a;base64,...'
import boundary:  data URL  ->  write file  ->  store the reference
```

The conversion is confined to `BackupService`. Nothing else knows a recording
was ever a data URL.

This is a real deviation from parity and is recorded as such in the checklist.
The test that matters: export from native, import into native, and the audio
must still play; plus import a genuine legacy data-URL backup and the audio must
play.

### The backup fixture is generated from the real legacy app, not written by hand

`docs/migration/fixtures/legacy-backup-v1.json` is produced by driving the
running legacy app with Playwright: seed progress, settings, stats, a custom
word with a photo, and a recording, then trigger `exportBackup()` and capture
the download.

A hand-written fixture tests the author's belief about the format. A generated
one tests the format. Given that the entire point of this phase is compatibility
with files Talki actually produces, the fixture must come from Talki.

### Accept both app names

`importBackup()` (index.html 1781) checks
`payload.app === 'talki' || payload.app === 'lia-words'`.

The master plan previously said "app must equal talki". That would reject
backups produced before the rename — held by exactly the long-standing users
this compatibility work exists for. Both names are accepted. There is a test
for each.

### Both import modes

`replace` clears every key first. `merge` unions the `lia:progress` array
through a `Set` and overwrites everything else. Both are implemented and tested.
`merge` is subtle: it is a union for progress only, not a deep merge.

### No new backup version

`BACKUP_VERSION` stays 1. The schema has not changed, so the version must not.
Bumping it would make files produced by the native app unreadable by the legacy
app during the overlap period when both are installed.

## Legacy source mapping

| Behaviour | Legacy location |
|---|---|
| `K` key definitions | index.html 1633-1637 |
| `Store` with three backends | index.html 1662-1745 |
| `sGet` / `sSet` / `sDel` | index.html 1747-1749 |
| `BACKUP_VERSION = 1` | index.html 1752 |
| `exportBackup()` | index.html 1754-1775 |
| `importBackup()` | index.html 1777-1799 |
| `loadAll()` | index.html 1801-1810 |
| `enterCat()` writing `lia:lastcat` | index.html 1823 |
| Custom word storage and 320x320 photo | index.html 3319-3342 |
| Recording capture and storage | index.html 3919-3957 |
| `preloadRecs(catId)` | index.html 3921-3927 |
| Progress reset semantics | parent tab, index.html 3248-3295 |

## Files to be created

```
apps/mobile/src/services/storage/
├── TalkiStorage.ts               the interface
├── sqliteKvStorage.ts            expo-sqlite/kv-store implementation
├── webStorage.ts                 IndexedDB implementation, test surface only
├── keys.ts                       the seven lia: key patterns
└── index.ts                      platform selection

apps/mobile/src/services/recordings/
└── recordingStore.ts             file-on-disk storage, data URL conversion

apps/mobile/src/services/backup/
├── BackupService.ts              exportV1, importV1, validate
├── schema.ts                     the V1 payload type and guards
└── dataUrl.ts                    data URL <-> file conversion

apps/mobile/src/state/
└── persistence.ts                loadAll equivalent, hydration

apps/mobile/tests/unit/
├── storage.test.ts
├── backup-export.test.ts
├── backup-import.test.ts
├── backup-roundtrip.test.ts
└── recordings.test.ts

tools/capture-legacy-backup-fixture.mjs
docs/migration/fixtures/legacy-backup-v1.json
apps/mobile/.maestro/persistence.yaml
```

## Contracts introduced

```ts
export const K = {
  progress: 'lia:progress',
  settings: 'lia:settings',
  stats: 'lia:stats',
  customIndex: 'lia:custom:index',
  custom: (id: string) => `lia:custom:${id}`,
  rec: (key: string) => `lia:rec:${key}`,
  lastcat: 'lia:lastcat',
} as const;

export interface TalkiBackupV1 {
  app: 'talki' | 'lia-words';
  version: 1;
  exported_at: string;
  word_count: number;
  data: Record<string, unknown>;
}

export type ImportMode = 'merge' | 'replace';

export interface BackupService {
  exportV1(): Promise<TalkiBackupV1>;
  importV1(payload: unknown, mode: ImportMode): Promise<{ imported: number }>;
  validate(payload: unknown): { ok: true } | { ok: false; reason: string };
}
```

## Behaviour to preserve exactly

- All seven keys, with the `lia:` prefix.
- `lia:progress` is a `string[]` of `"catId:word"`.
- `lia:stats` is `{ [key]: { seen, wrong } }`.
- `lia:custom:<id>` is `{ id, word, emoji, photo }`.
- Export payload is exactly `{ app, version, exported_at, word_count, data }`.
- `app` is `"talki"` on export.
- `word_count` equals the learned-set size.
- `data` contains every storage key verbatim.
- `exported_at` is an ISO string.
- Export sets `settings.lastBackup`.
- Import accepts `"talki"` and `"lia-words"`.
- Import rejects a payload with no `data`, and unparseable JSON, without
  throwing to the caller.
- `replace` deletes all keys first; `merge` unions progress and overwrites the
  rest.
- Import clears the recordings cache and rehydrates state.
- `settings.puzzleLevel` and `settings.lastBackup` survive a round trip.

## Deliberate deviations

- Recordings are files natively; data URLs only at the export and import
  boundary. Recorded in checklist section 14.

## Test plan

### Tier 1

`storage.test.ts`
- get, set, remove and keys round-trip for every value type Talki stores
- `get` on a missing key returns `null`, never `undefined` and never throws
- keys survive a simulated restart of the storage layer
- the seven key patterns produce the exact expected strings

`backup-export.test.ts`
- payload shape exactly matches the V1 contract, no extra fields
- `app === 'talki'`, `version === 1`
- `word_count` equals the learned-set size
- `data` contains every key present in storage
- `exported_at` parses as a valid ISO date
- `settings.lastBackup` is written

`backup-import.test.ts`, using the generated fixture
- the real `fixtures/legacy-backup-v1.json` imports successfully
- a payload with `app: 'lia-words'` imports successfully
- a payload with `app: 'something-else'` is rejected with a reason
- a payload with no `data` is rejected
- unparseable JSON is rejected without throwing
- `replace` mode clears pre-existing keys not present in the payload
- `merge` mode unions `lia:progress` rather than overwriting it
- `merge` mode overwrites `lia:settings` rather than merging it
- missing keys in the payload do not crash the import

`backup-roundtrip.test.ts`
- seed every key type, export, wipe, import, assert deep equality
- `settings.puzzleLevel` survives
- `settings.lastBackup` survives
- custom words including the photo survive
- stats survive with exact `seen` and `wrong` values

`recordings.test.ts`
- a recording written as a file is readable back
- file to data URL to file round-trips byte-identically
- an exported payload contains a data URL, not a file path
- importing a legacy data URL produces a playable file
- deleting a word's recording removes the file, not just the key

### Tier 2

No UI. Gate item 5 is substituted, per `validation.md` section 6.

`playwright test` must still pass, proving the app builds and boots with the
storage layer present. Add one spec that exercises the web storage
implementation through the service interface so the abstraction is proven to
have at least two working implementations.

### Tier 3 — this phase needs real device proof

Web reload is not a process kill. SQLite durability must be shown natively.

`apps/mobile/.maestro/persistence.yaml`:
1. launch the app
2. write a known progress value through a dev-only trigger
3. `stopApp`
4. relaunch
5. assert the value is still present

Plus manual attestation, with the device named:
- install, seed data, force-stop from Android settings, relaunch, data intact
- import the real legacy fixture on-device and confirm the recording plays
- fill storage with a large recording set and confirm no crash

## Screenshot manifest

None. Substituted by `docs/migration/phase-03-storage-report.md` containing:

- every key with its value type and a representative size
- measured size of a typical recording as file versus as data URL
- import timing for the real fixture
- storage footprint after importing the fixture
- which import and validation paths are covered by which test

## Risks and open questions

**`expo-sqlite/kv-store` value size limits.** Recordings are the largest values
and are moving to files, so the remaining large value is a custom word photo
(320x320 JPEG, roughly 20-40 KB). Default: keep photos in the KV store for now
and measure. If a photo exceeds 256 KB, apply the same file-reference treatment
and record the change.

**Producing the fixture requires a working legacy app.** Default: drive it with
Playwright following the pattern in `tests/test_suite.py`'s `test_storage`,
which already performs an export with `accept_downloads=True`. If that proves
impractical, hand-construct the fixture but mark it clearly as synthetic in the
report and raise it as a risk, because a synthetic fixture proves less.

**Recording filename encoding.** Keys contain Hebrew and a colon
(`animals:כֶּלֶב`). Colons are illegal in filenames on some platforms. Default:
hash the key to produce the filename and keep the mapping in the KV value. Do
not attempt to sanitise Hebrew into ASCII.

**Web needs a different storage backend.** Default: implement `webStorage.ts`
over IndexedDB so Tier 2 works. It is test-only and must never be selected on
a native platform. Assert that in a test.

## Exit criteria

- [ ] `TalkiStorage` interface exists and no screen or domain module imports
      `expo-sqlite` directly
- [ ] All seven `lia:` keys preserved verbatim
- [ ] `docs/migration/fixtures/legacy-backup-v1.json` generated from the real
      legacy app, or marked synthetic with the risk recorded
- [ ] The real fixture imports successfully
- [ ] `app: 'lia-words'` accepted; `app: 'other'` rejected with a reason
- [ ] Both `merge` and `replace` implemented and tested
- [ ] `merge` unions progress and overwrites everything else
- [ ] Export payload matches the V1 contract exactly, `BACKUP_VERSION` still 1
- [ ] `puzzleLevel` and `lastBackup` survive a round trip
- [ ] Recordings stored as files, exported as data URLs, round-trip proven
- [ ] Malformed input never throws to the caller
- [ ] Maestro persistence flow passes, or manual force-stop attested with the
      device named
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green
- [ ] `expo export --platform web` succeeds
- [ ] `playwright test` still green
- [ ] `docs/migration/phase-03-storage-report.md` written with measurements
- [ ] No parent UI, no backup screen built
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-03-report.md` written
