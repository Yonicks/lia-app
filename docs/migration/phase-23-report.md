# Phase 23 report — Landscape Categories and Vocabulary

## Summary

Phase 23 redesigns the category / vocabulary learning surface for landscape:
`LandscapeWorldShell` (`variant="detail"`) with the shared home world
background, `LandscapeTopBar` (back accessory + points/music/parent brand),
a compact header panel (title + `LandscapeProgress` + cards/play/practice
CTAs), and a token-driven `LandscapeWordGrid` with `LandscapePageIndicator`
paging when words exceed one viewport page. Portrait wrap-grid layout and
`useDevice`/`homePaddingInline` paths are removed. All 10 built-in
categories + synthetic `mine`, audio/TTS (PLAIN form), progress/celebrate,
and navigation CTAs are preserved. Capacitor untouched. No invented art;
no dedicated category mock — visual language inherits hubs + shared shell.

## Pre-flight inventory (recorded before edits)

- **Current tree:** `CategoryScreen` → `TalkiScreen` header + play row +
  vertical `ScrollView` `WordGrid` (flexWrap `WordTile` minWidth 130).
- **Content:** 10 built-ins (182 words) + `mine` via `allCats(custom)`.
- **Reusable seams:** `LandscapeWorldShell` detail (Stickers precedent),
  `LandscapeTopBar`, `LandscapeProgress`, `LandscapePageIndicator`,
  `landscapeTokens` / `useLandscapeLayout`, home world BG.
- **Assets:** Word art EXISTING (182); category icons/art EXISTING;
  no dedicated category world BG — reuse `landscapeBackgrounds.home`
  (same as Stickers). `talki-bg-category-header.png` on disk but not a
  full landscape world — left unregistered (not invented).
- **Expected edits:** CategoryScreen / WordTile / WordGrid, tokens +
  `LandscapeWordGrid`, `wordGridPages`, testIds, unit/e2e, evidence.
- **Risks:** header + CTA + grid height on 667×375; Expo web raster paint;
  paging must keep every word reachable.
- **Validation:** tsc, eslint, vitest, expo export, Playwright category +
  navigation.

## Gate

Phase 22 report ends with `PRACTICE HUB READY FOR PHASE 23` — confirmed.

## Source-derived category / content findings

| Metric | Value |
|---|---|
| Built-in categories | **10** (`CATEGORIES`) |
| Built-in words | **182** |
| Per-category counts | animals/food/colors/home 26; outside 18; actions 16; family/body 12; numbers/emotions 10 |
| Synthetic | `mine` (`allCats`) — custom words length |
| Word grid (tokens) | compactPhone 5×2; phone 6×2; tablet 7×2; largeTablet 8×2 |
| Animals pages (compact) | 26 ÷ 10 → **3** pages |
| Emotions pages (phone+) | 10 ≤ page size → **1** page on compact+ |

## Acceptance criteria

- [PASS] Category/vocabulary UI is landscape-native (world shell + paged
  word grid; not a widened portrait wrap).
- [PASS] All current categories remain reachable (Home strip + e2e mine/
  animals/emotions; domain unchanged).
- [PASS] All words remain reachable (paging walk collects every animals
  index 0..25).
- [PASS] Custom/my-words behavior remains functional (empty mine state
  e2e + existing custom-words unit coverage).
- [PASS] Audio/TTS preserved (PLAIN `wordVoiceService.say`; niqqud
  display-only; burst/degraded e2e).
- [PASS] Progress/completion/celebration preserved (`useCategoryProgress`,
  `markLearned`, `RewardOverlay`).
- [PASS] Verified image aspect handling (`resizeMode="contain"`; no stretch).
- [PASS] Compact phones and tablets pass layout review (phase-23 matrix +
  touch/reachability; no critical vertical overflow).
- [PASS] No feature-local breakpoint hacks (`landscapeTokens` only).
- [PASS] Full relevant regression passes (see Tests).
- [PASS] This report exists.

## Files changed

Production:
- `apps/mobile/src/features/categories/CategoryScreen.tsx` — landscape
  detail learning surface.
- `apps/mobile/src/features/categories/WordTile.tsx` — token-sized tiles,
  contain art, a11y label.
- `apps/mobile/src/features/categories/WordGrid.tsx` — re-export seam to
  `LandscapeWordGrid` (portrait wrap removed).
- `apps/mobile/src/design-system/landscape/LandscapeWordGrid.tsx` — new
  flexible word-grid primitive.
- `apps/mobile/src/design-system/landscape/tokens.ts` — `wordGridColumns`
  / `wordGridRows` / `wordArtSize` / `wordLabelSize`.
- `apps/mobile/src/design-system/landscape/index.ts` — export word grid.
- `apps/mobile/src/domain/vocabulary/wordGridPages.ts` — pure paging.
- `apps/mobile/src/testing/testIds.ts` — `category.grid` / `page` /
  `pageIndicator`.

Tests / evidence:
- `apps/mobile/tests/unit/word-grid-pages.test.ts` — new.
- `apps/mobile/tests/unit/landscape-shell.test.ts` — word-grid contract.
- `apps/mobile/tests/e2e/category.spec.ts` — Phase 23 landscape suite +
  `captureMatrix(..., '23', ...)`.
- `docs/migration/screenshots/phase-23/` — matrix evidence.

## Screenshot index

Under `docs/migration/screenshots/phase-23/` (8 viewports × 4 shots):

- `{W}x{H}-category-emotions.png` — small category
- `{W}x{H}-category-animals.png` — large category
- `{W}x{H}-category-animals-learned.png` — learned-state tiles
- `{W}x{H}-category-mine.png` — empty custom/mine

Viewports: 667×375, 740×360, 844×390, 932×430, 1024×768, 1133×744,
1280×800, 1366×1024.

No phase-0N screenshot noise was produced by this run (nothing to revert).

## Compact / phone / tablet notes

- Compact (667×375 / 740×360): 5×2 word page + page dots for large cats;
  CTA row is a single-line horizontal strip; header panel stays compact.
- Modern phones (844 / 932): 6×2; emotions fits one page.
- Tablets: denser columns (7–8) and larger art/label from tokens, not
  uniform phone scale-up.

## Native coverage

Expo web Playwright matrix only for this phase (same as Phase 20–22).
Native device QA remains a later release-gate item. Capacitor not modified.

## Assets still missing

None required for Phase 23 word learning (word art + home world EXISTING).
Optional unused `talki-bg-category-header.png` remains unregistered — detail
screens reuse the home landscape world for product continuity.

## Deviations

1. No dedicated Phase 23 category reference mock — composition inherits
   hub visual language + detail shell precedent (documented in plan).
2. Expo web Playwright captures show chrome, title, progress, CTAs, word
   labels, and page dots; world-background rasters may under-paint on the
   web test surface (same pattern as Phases 21–22). Native remains the
   product target; art is registered via `require()`.
3. Mid-run `expo serve` once dropped (`ERR_CONNECTION_REFUSED`); failed
   tablet projects were re-run clean (54/54). Overall gate: green.

## Behavior preservation evidence

- `lia:lastcat` written on open (e2e).
- First animals tile speaks `כלב` PLAIN once and shows ★.
- Niqqud off: display stripped; spoken form still `כלב`.
- Back → Home; cards/play/practice testIDs present.
- Empty mine Hebrew empty-state preserved.
- Touch ≥48 and reachability audits clean; no `<select>` on child UI.

## Risks carried forward (Phase 24)

1. Individual games still need landscape redesign (Phases 24–25).
2. Expo web may under-render world BG rasters in Playwright captures.
3. Stacked router `push` between category ids can ghost under Expo web —
   e2e uses fresh `gotoCategory` / Home open for multi-shot captures.

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0
$ npx vitest run                   # 50 files / 5528 tests PASS
$ npx expo export --platform web   # exit 0
$ npx playwright test tests/e2e/category.spec.ts \
    tests/e2e/navigation.spec.ts --workers=1 --update-snapshots
  # First full pass: 93 passed; 51 failed after expo serve died
  # (ERR_CONNECTION_REFUSED) mid tablet-1133.
$ npx playwright test tests/e2e/category.spec.ts \
    tests/e2e/navigation.spec.ts --workers=1 \
    --project=tablet-1133 --project=tablet-16-10 --project=large-tablet \
    --update-snapshots
  # 54 passed (1.2m) — failed projects re-run clean.
  # Combined: all 8 viewport projects green for category + navigation.
```

## Explicit phase status

**CATEGORIES READY FOR PHASE 24**
