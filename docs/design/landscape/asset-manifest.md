# Talki Landscape Asset Manifest

Status values:

- `REFERENCE` — committed visual reference only, not a production asset.
- `EXISTING` — current repository production asset can be reused.
- `NEEDED` — production asset is required.
- `DESIGN-BLOCKED` — cannot claim visual completion until supplied/approved.
- `OPTIONAL` — polish asset that does not block core implementation.

## Committed references

| Asset | Status | Purpose |
|---|---|---|
| `reference/talki-landscape-master.*` | REFERENCE (not committed, optional) | Original composite landscape mock — never supplied; absence is not a gate failure per `reference/README.md` |
| `reference/home.png` | REFERENCE | Home crop (1448×1086) |
| `reference/games.png` | REFERENCE | Games hub crop (1672×941) |
| `reference/practice.png` | REFERENCE | Practice hub crop (1448×1086) |

## Production asset families

Statuses below were verified against `apps/mobile/src/design-system/assets.ts`
during the Phase 16 audit (see `docs/migration/phase-16-audit.md` §7).

### World backgrounds

| Asset family | Status | Notes |
|---|---|---|
| Home world background | EXISTING | `assets/v2/landscape/talki-landscape-bg-home.png` (1672×941) — registered as `landscapeBackgrounds.home` in `assets.ts` (Phase 18). Cover + focal `{x:0.48,y:0.42}` via `LandscapeWorldBackground` / expo-image `contentPosition`. |
| Games world background | EXISTING | `assets/v2/landscape/talki-landscape-bg-games.png` (1672×941) — `landscapeBackgrounds.games`; focal `{x:0.55,y:0.4}` (castle bias). |
| Practice world background | EXISTING | `assets/v2/landscape/talki-landscape-bg-practice.png` (1672×941) — `landscapeBackgrounds.practice`; focal `{x:0.5,y:0.42}`. |
| Tablet-compatible crops/source | EXISTING (single source + focal) | Source is ~16:9. On 4:3 tablets (1024×768) cover crops top/bottom (`coverCropAxis` → vertical). Focal Y ~0.42 keeps path/meadow; no separate tablet crop file required. Resolution is sufficient for 1366×1024 (cover scales up modestly). Revisit only if native QA shows softness. |

### Shared brand/chrome

| Asset family | Status | Notes |
|---|---|---|
| Talki logo | EXISTING | `brand.headerLogo` (`assets/v2/brand/talki-header-logo.png`); verify fit at landscape scale |
| Yellow Talki mascot | EXISTING | Two variants registered — `introAssets.star` and `homeAssets.heroStar`; Phase 18/20 must pick one |
| Music control art | EXISTING | `uiIcons.music` (`assets/v2/icons/talki-ui-icon-music.png`) |
| Parent/profile control art | VERIFY | `uiIcons.settings` exists but is not wired into `TopBar` today — the logo itself is the only tappable/long-press parent trigger (`src/components/shell/TopBar.tsx`); the reference shows a separate small parent icon. Open wiring decision, not a missing-art blocker |
| Star/reward art | EXISTING | `uiIcons.star` (`assets/v2/icons/talki-ui-icon-star.png`); note the current `TopBar` points pill is display-only, not tappable — see interaction-map "Stars/rewards" |
| Side navigation arrows | OPTIONAL / CAN-BE-UI | `uiIcons.chevron` (`assets/v2/icons/talki-chevron-left.png`) exists; the mirrored forward arrow can be a transform, no new art required |

### Home categories

10 built-in categories (verified via `src/domain/vocabulary/categories.ts`) plus
the synthetic `mine` (custom words) category.

| Asset family | Status | Notes |
|---|---|---|
| Category icons (small) | EXISTING | `categoryIcons` — all 10 built-ins registered (`assets/v2/categories/talki-cat-icon-*.png`) |
| Category hero art | EXISTING | `categoryArt` — all 10 built-ins registered (`assets/v2/categories/talki-cat-art-*.webp`) |
| `mine` (custom words) art | EXISTING (fallback) | No dedicated art; falls back to `brand.starMark`, matching legacy behavior |

### Games

The current app registers **11 games** (`src/features/games/shell/gameRegistry.ts`).

| Asset family | Status | Notes |
|---|---|---|
| Card art — memory, quiz, missing, cards, sounds, count, puzzle (7) | EXISTING | `gameCardAssets` in `assets.ts` |
| Card art — match, bubbles, sort, speech (4) | EXISTING | `assets/v2/game-menu/talki-game-card-{match,bubbles,sort,speech}.png` — supplied and verified against the reference style. Not yet added to `gameCardAssets`/`gameCards.ts` (Phase 21's job) |

### Practice

**Six practice modes** (`src/features/practice/practiceRegistry.ts`) require six
card illustrations matching the reference visual language.

| Asset family | Status | Notes |
|---|---|---|
| Card art — focus, cloze, temptation, receptive, pairs, combine (6) | EXISTING | `assets/v2/practice-menu/talki-practice-card-{focus,cloze,temptation,receptive,pairs,combine}.png` — supplied and verified. No registry entry/component wiring yet (Phase 22's job); `PracticeMenuScreen` is still the plain text list from Phase 11 |

## Asset implementation rules

- Do not use the reference screenshot as a card/background production asset.
- Do not bake interactive labels into raster art.
- Do not stretch source art.
- Record source dimensions and focal crop notes once production assets are approved.
- Prefer explicit asset registry entries over ad-hoc `require()` calls scattered across screens.
- Missing required art must remain visible in reports as a design dependency.
