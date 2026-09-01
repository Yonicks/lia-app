# Phase 2 asset report

Real measurements taken 2026-09-01 against the working tree, using
`tools/generate-mobile-asset-registry.mjs` and standard `find`/`du`. All
counts below are reproducible with the commands shown in each section.

## Total asset count and total bytes

```
$ find assets -type f | wc -l
384
$ du -sb assets
56435147	assets
```

**384 files, 56,435,147 bytes (~53.8 MiB / ~56.4 MB decimal)** under
`assets/` at the repository root. This matches the phase plan's "roughly
55 MB of assets across 384 files" estimate closely.

## Bytes per top-level directory under assets/

```
$ for d in assets/*/; do
    echo "$d: $(find "$d" -type f | wc -l) files, $(du -sb "$d" | awk '{print $1}') bytes"
  done
assets/audio/: 36 files, 22989642 bytes
assets/v2/:    155 files, 17223041 bytes
assets/words/: 193 files, 16222464 bytes
```

| Directory | Files | Bytes | ~MiB |
|---|---:|---:|---:|
| `assets/audio/` | 36 (35 `.mp3` + `audio-logic.js`) | 22,989,642 | 21.9 |
| `assets/v2/` | 155 | 17,223,041 | 16.4 |
| `assets/words/` | 193 (182 word images + 10 `.gitkeep` + 1 cover) | 16,222,464 | 15.5 |
| **Total** | **384** | **56,435,147** | **53.8** |

Audio is the single largest directory by weight despite having the fewest
files — music tracks dominate (see largest-files table below).

## The twenty largest files

```
$ find assets -type f -printf '%s\t%p\n' | sort -rn | head -20
```

| Bytes | Path |
|---:|---|
| 3,677,280 | `assets/audio/music/13_warm_card_carousel_b.mp3` |
| 2,511,579 | `assets/audio/music/12_warm_card_carousel_a.mp3` |
| 2,206,602 | `assets/audio/music/10_sunny_card_parade_a.mp3` |
| 1,972,430 | `assets/audio/music/11_sunny_card_parade_b.mp3` |
| 1,922,328 | `assets/words/food/food.png` |
| 1,571,119 | `assets/audio/music/07_talki_playroom_b.mp3` |
| 1,512,670 | `assets/audio/music/09_little_discoveries_b.mp3` |
| 1,494,665 | `assets/audio/music/02_gameplay_bouncy.mp3` |
| 1,469,587 | `assets/audio/music/03_gameplay_curious.mp3` |
| 1,441,375 | `assets/audio/music/04_gameplay_gentle.mp3` |
| 1,370,906 | `assets/audio/music/06_talki_playroom.mp3` |
| 1,179,941 | `assets/audio/music/05_listening_focus.mp3` |
| 1,162,336 | `assets/audio/music/08_little_discoveries_a.mp3` |
| 1,153,610 | `assets/audio/music/01_main_menu_welcome.mp3` |
| 963,272 | `assets/v2/game-menu/talki-game-card-animal-sounds.png` |
| 897,700 | `assets/v2/brand/talki-header-logo.png` |
| 864,713 | `assets/v2/game-menu/talki-game-card-flashcards.png` |
| 863,846 | `assets/v2/game-menu/talki-game-card-where-is.png` |
| 819,079 | `assets/v2/game-menu/talki-game-card-challenge.png` |
| 784,660 | `assets/v2/game-menu/talki-game-card-memory.png` |

Notable: `assets/words/food/food.png` (the `food` category cover image — one
of the files the asset-registry generator deliberately excludes, since it is
not a word image) is, at 1.92 MB, the single largest image in the entire
project — larger than any of the 182 actual word images.

## Registry entry count per module

```
$ grep -c "require(" apps/mobile/src/data/assets/words.generated.ts
182
$ grep -c "require(" apps/mobile/src/data/assets/v2.generated.ts
155
$ grep -c "require(" apps/mobile/src/data/assets/audio.generated.ts
35
```

| Module | Entries |
|---|---:|
| `words.generated.ts` | 182 |
| `v2.generated.ts` | 155 |
| `audio.generated.ts` | 35 (13 music + 22 SFX) |

Note: `audio.generated.ts` has 35 entries — all 13 music tracks plus all 22
SFX files. `audio-logic.js`'s `MUSIC_FILES` only names 10 of those 13 tracks
by key (`02_gameplay_bouncy.mp3`, `03_gameplay_curious.mp3` and
`04_gameplay_gentle.mp3` are on disk but not currently mapped by any
`MUSIC_FILES` key); the registry includes all 13 anyway because they are real
files under `assets/audio/music/`, consistent with "every registry entry
resolves to a file that exists on disk" rather than gating on current usage.
13 music + 22 SFX = 35.

## Word images on disk referenced by no word

```
$ python3 - <<'EOF'
import re, os
with open('index.html', encoding='utf-8') as f:
    content = f.read()
calls = re.findall(r"art\('(\w+)','([a-z0-9-]+)'\)", content)
paths = {f"assets/words/{c}/{'talki-colors-shapes-'+s if c=='colors' else 'talki-'+c+'-'+s}.png"
         for c, s in calls}
disk = {os.path.join(r, fn) for r, _, fs in os.walk('assets/words') for fn in fs
        if fn.startswith('talki-') and fn.endswith('.png')}
print("on disk, unreferenced:", sorted(disk - paths))
print("disk count:", len(disk), "referenced count:", len(paths))
EOF
on disk, unreferenced: []
disk count: 182 referenced count: 182
```

**Finding, contradicting the phase prompt's stated ground truth:** the phase
prompt and `docs/migration/phases/phase-02-plan.md` both assert "183 `talki-*`
PNGs against 182 words" and instruct this report to name the 183rd,
unreferenced file. Measured directly against the current working tree, this
is **not the case**: `assets/words/` contains exactly **182** files matching
the `talki-{cat}-{slug}.png` / `talki-colors-shapes-{slug}.png` pattern, and
all 182 are referenced by exactly one `art()` call each (verified via a
Python script that extracts every `art(cat, slug)` call from `index.html` and
diffs the resulting path set against `find assets/words -iname 'talki-*.png'`
in both directions). There are zero orphaned word images and zero missing
ones. The 384-file/~55 MB totals in the plan do check out; the specific
"183rd image" claim does not, in this working tree, today. Per the standing
rule that docs are secondary and known to contain stale claims, this is
recorded as a finding rather than silently "fixed" by inventing a 183rd file
or deleting anything.

## Word images referenced but missing from disk

None. See the script output immediately above — `referenced count: 182`
against `disk count: 182`, with an empty set difference in both directions.

## Size of `npx expo export --platform web` output

```
$ npx expo export --platform web
...
Exported: dist
$ du -sh apps/mobile/dist
1.3M	apps/mobile/dist
$ du -sb apps/mobile/dist
1146523	apps/mobile/dist
$ find apps/mobile/dist -type f | wc -l
22
```

**1,146,523 bytes (~1.1 MiB) across 22 files.** This number does **not**
reflect the 56 MB of word/UI/audio assets measured above — Phase 2 adds no
screen and no `app/` code imports `apps/mobile/src/domain` or
`apps/mobile/src/data/assets` yet, so nothing in this phase's new code is
part of the bundle Metro's tree-shaking walks from the router entry point.
This is expected and correct for a phase with no UI; it should not be read
as "the assets bundle small." Once a later phase's screens start importing
from the generated registries, the web bundle size will grow to reflect
whatever subset of the 56 MB those screens actually reference, and that
number — not this one — is the one to watch.

## Bundle-strategy recommendation (explicitly deferred)

Not a decision made in this phase. For the record:

- All 384 files / ~55 MB currently ship as local `require()`-bundled assets
  once referenced, which is heavy for an app binary (particularly the ~22 MB
  audio directory) but not obviously fatal for a Hebrew early-speech
  learning app used offline by families.
- Three follow-on options exist for a future phase to weigh once real usage
  patterns are known: (1) ship everything bundled, accepting binary size;
  (2) move audio (the heaviest, least latency-sensitive category) to
  on-demand remote loading with local caching; (3) recompress music tracks
  (several exceed 1.5 MB per track at what all sound like fairly high
  bitrates for background loops) before deciding on remote loading at all.
- This phase deliberately implements none of the above — see
  `docs/migration/phases/phase-02-plan.md` "Bundle size is measured now,
  decided later." The number is now known; the decision belongs to whichever
  phase first needs the app to actually launch with these assets wired in.
