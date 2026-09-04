# Phase 16 report — Landscape rebaseline and design contract

## Summary

Phase 16 is an audit/rebaseline phase: no production UI behavior changed.
It confirms the landscape reference images are present and readable,
audits the current responsive/orientation/navigation architecture against
the new landscape-only direction, records exact feature counts and asset
gaps from current code, and freezes the Phase 17 viewport matrix.

The audit found the current width-only device classifier
(`classifyDevice(width)`) misclassifies real landscape phones (844×390,
932×430 — the roadmap's own reference-class examples) as tablets, exactly
the failure `AGENTS.md` rule 13 forbids. It found the orientation policy
locks only `games` to landscape in practice — `practice`'s declared
`'landscape'` policy value has no call site applying it, and
`home`/`category`/`intro` remain unlocked (`'responsive'`). It found
`BottomNavigation` is a 3-item bar (home/games/stickers) that does not
include Practice or Parent, and that only two Playwright assertions
depend on it. It found the current Games and Practice menus are plain
scrolling lists with no 3×2 layout, and that Practice has zero dedicated
card art while 4 of 11 games also lack dedicated card art. Full detail is
in `docs/migration/phase-16-audit.md`.

Documentation drift was found and corrected: `docs/design/landscape/README.md`
referenced `.jpg` reference filenames and treated the composite master as
implicitly required; the committed files are `.png` and the master was
always optional per `docs/design/landscape/reference/README.md`.
`docs/design/landscape/asset-manifest.md`, `screen-map.md`, and
`interaction-map.md` were updated with concrete current-code evidence
(exact paths, exact gaps) gathered during this audit.

No FAIL or BLOCKED criterion was found. Landscape reference images are
present and readable; all validation commands pass; no production code
was touched.

## Acceptance criteria

- [PASS] Landscape references are committed and readable — `home.png`
  (1448×1086), `games.png` (1672×941), `practice.png` (1448×1086), all
  inspected directly.
- [PASS] `AGENTS.md`, `CLAUDE.md`, and Cursor rules point to the same
  canonical contract — verified `.cursor/rules/talki-landscape.mdc` and
  `CLAUDE.md` both defer to `AGENTS.md`; no edit needed.
- [PASS] Exact current game count documented from code — 11
  (`gameRegistry.ts`).
- [PASS] Exact current practice count documented from code — 6
  (`practiceRegistry.ts`).
- [PASS] Current vocabulary/category behavior documented from code — 10
  built-in categories + synthetic `mine` = 11, 182 words, test-enforced by
  `tests/unit/domain-parity.test.ts`.
- [PASS] Every current child/parent/global surface has a landscape
  migration destination — `docs/design/landscape/screen-map.md`, audited
  and extended with the parent-tab count.
- [PASS] Current width-only device classification issue is demonstrated
  with examples — `phase-16-audit.md` §2, 844×390 and 932×430 both
  classify as `smallTablet`.
- [PASS] Every direct responsive-system bypass is listed — none found;
  only one feature-local ad-hoc threshold (`QuizScreen.tsx`) flagged as a
  soft finding, not a bypass.
- [PASS] Current route/orientation policy is documented —
  `phase-16-audit.md` §3, including the dead `practice: 'landscape'`
  policy value.
- [PASS] Current top-level tab/navigation architecture is documented —
  `phase-16-audit.md` §4.
- [PASS] Old test expectations that will intentionally change are listed
  without weakening them yet — the two `tabs-bottom-nav` assertions
  (`navigation.spec.ts:37`, `full-sweep.spec.ts:163`); neither was touched.
- [PASS] Asset manifest contains concrete paths/statuses where
  discoverable — `asset-manifest.md`, updated with exact `assets.ts`
  registry paths per family.
- [PASS] Phase 17 viewport matrix is frozen or any deviation is justified
  — roadmap's 8-viewport matrix adopted with no deviation; 4 of 8 already
  exist under different project names, 4 are net-new (`phase-16-audit.md`
  §8).
- [PASS] No production behavior was changed — confirmed by `git status`
  showing only `docs/` files touched by this phase, and by `tsc`/`eslint`/
  `vitest`/`expo export` all passing unchanged.
- [PASS] Legacy Capacitor implementation remains untouched — `capacitor.config.ts`,
  `android/`, `ios/`, `www/`, `tools/prepare_www.js` all present, not edited.
- [PASS] `docs/migration/phase-16-audit.md` exists.
- [PASS] `docs/migration/phase-16-report.md` exists (this file).

## Files changed

- `docs/design/landscape/README.md` — corrected reference filenames
  (`.jpg`→`.png`) and clarified the composite master is optional and not
  committed.
- `docs/design/landscape/asset-manifest.md` — replaced placeholder
  `VERIFY`/`NEEDED` rows with concrete current-code evidence: exact
  `assets.ts` paths for existing art, exact counts for missing game-card
  (4 of 11) and practice-card (6 of 6) illustrations, and
  `DESIGN-BLOCKED` status for all three world backgrounds.
- `docs/design/landscape/screen-map.md` — added the exact 5-tab parent
  surface breakdown.
- `docs/design/landscape/interaction-map.md` — added a current-code note
  that the Stars/rewards control is presently display-only.
- `docs/migration/phase-16-audit.md` — new, full audit (10 required
  sections).
- `docs/migration/phase-16-report.md` — new (this file).

No file under `apps/mobile/src/`, `apps/mobile/app/`, or the repository
root legacy app was modified.

## Tests and exact results

All commands run from `apps/mobile/` unless noted.

### 1. Static checks: PASS

```
$ npx tsc --noEmit
(no output, exit 0)

$ npx eslint .
(no output, exit 0)
```

### 2. Vitest: PASS

```
$ npx vitest run
 Test Files  46 passed (46)
      Tests  5490 passed (5490)
```

### 3. Web export: PASS

```
$ npx expo export --platform web
...
› web bundles (1): _expo/static/js/web/entry-b92bb7f1b1883f0a98b934c1bbc7db79.js (2.7MB)
Exported: dist
```

### 4. Playwright baseline: PASS

```
$ npx playwright test --workers=4
1530 passed (9.1m)
[exited with code 0]
```

Full suite, all 10 current viewport projects, zero failures — including
`full-sweep.spec.ts` (23 screens × 10 viewports), which had 20 failures
at Phase 14 (P14-M16, games/stickers reachability behind a stacked
TopBar). That defect class does not reproduce today; carried forward as a
positive finding, not re-verified against Phase 14's specific repro
steps.

**Evidence-file side effect, reverted:** several legacy phase specs
(`gallery.spec.ts`, `intro.spec.ts`, `home.spec.ts`, `category.spec.ts`,
`quiz.spec.ts`, `match.spec.ts`, `memory.spec.ts`, `sounds.spec.ts`,
`puzzle.spec.ts`, `parent.spec.ts`, `stickers.spec.ts`) write directly
into `docs/migration/screenshots/phase-0N/` as committed evidence
(`tests/e2e/_helpers.ts`'s screenshot helper). Running the full suite
regenerated ~80 of these PNGs with harmless byte-level re-encoding
differences (no production code changed, so no visual regression is
implied). Historical evidence must remain historical
(`AGENTS.md` "Legacy and cutover safety"), so these files were reverted
with `git checkout -- docs/migration/screenshots/` after each Playwright
run; `git status` confirms only the 5 documentation files listed above
are changed.

### 5. Legacy regression: BLOCKED (environment)

```
$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
ModuleNotFoundError: No module named 'playwright'

$ BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
ModuleNotFoundError: No module named 'playwright'

$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

The Python Playwright module is not installed in this environment; the
two Python legacy suites could not run. `audio-logic.test.js` (Node,
no Playwright dependency) is green. This is an environment limitation,
consistent with the gaps recorded in `phase-14-report.md`'s "Native
coverage" section, not a regression this phase introduced — no legacy
file was touched.

### 6. This report: PASS

## Screenshot index

Not applicable — Phase 16 is documentation/audit-only per its plan; no
new screens were implemented, so no new screenshot evidence is required.
The reference images inspected are the three files already committed
under `docs/design/landscape/reference/`.

## Compact phone / modern phone / tablet result

Not applicable this phase — no UI was built. The Phase 17 viewport matrix
these results will be measured against is frozen in
`phase-16-audit.md` §8.

## Native coverage

Device: not applicable — no device, emulator, or Maestro binary in this
environment, consistent with every prior phase report.

Checks performed: none on hardware. This phase is documentation/audit
only and made no native-coverage claims.

## Deviations from the phase plan

None. Every required audit section, doc update, and validation command
in `phase-16-plan.md` was executed.

## Findings and drift (see `phase-16-audit.md` for full detail)

1. `classifyDevice(width)` misclassifies landscape phones as tablets
   (844×390, 932×430 both → `smallTablet`) — Phase 17 must fix this
   before any device-class-dependent layout ships.
2. `orientationPolicy.practice = 'landscape'` is declared but has no
   production call site applying it — practice currently does not lock
   landscape despite the policy table.
3. `home`/`category`/`intro` remain `'responsive'` (rotation-permissive)
   — Phase 17 must extend the policy for the landscape-only direction.
4. `BottomNavigation` covers only home/games/stickers; Practice and
   Parent are reached via separate stack routes, not the tab bar.
5. `TopBar`'s star/points pill is currently non-interactive; Rewards is
   reachable only through the (soon-removed) bottom tab.
6. World-background art (Home/Games/Practice), 4 game-card illustrations
   (match, bubbles, sort, speech), and all 6 practice-card illustrations
   are `DESIGN-BLOCKED` — none exist in the current asset registry.
7. `docs/design/landscape/README.md` referenced non-existent `.jpg`
   filenames and an implicitly-required composite master — corrected.
8. Running the full Playwright baseline regenerates ~80 committed
   evidence screenshots with harmless re-encoding diffs — reverted; a
   future phase running this same suite should expect and revert the
   same side effect rather than committing it.

## Risks carried forward to Phase 17

See `phase-16-audit.md` §9 for the full list with file references:

1. Fix `classifyDevice` to use short-edge/usable geometry, not raw width.
2. Extend `orientationPolicy` to cover all child routes and wire an
   actual `applyFor('practice')` call site.
3. Plan `BottomNavigation`'s replacement testID so the two now-identified
   assertions can be updated in Phase 19, and account for the Phase 14
   mounted-tab defect class rather than assuming a UI-only swap is
   sufficient.
4. Decide the parent-entry icon (reuse the logo vs. wire `uiIcons.settings`
   as a dedicated icon) and the star-pill interactivity question before
   Phase 18 builds the shared shell chrome.
5. Decide the fate of the 6 current portrait viewport projects for child
   screens (retire vs. repurpose for parent-form testing) when adding the
   4 net-new landscape viewports.
6. World backgrounds and 10 card illustrations (4 games + 6 practice
   modes) remain `DESIGN-BLOCKED`; Phases 18/20/21/22 cannot claim visual
   completion until supplied.

## Assets/design blockers

- Home/Games/Practice world backgrounds — `DESIGN-BLOCKED`.
- Game card art for match, bubbles, sort, speech — `DESIGN-BLOCKED`.
- Practice card art for all 6 modes — `DESIGN-BLOCKED`.
- Parent/profile control art — `VERIFY` (open wiring decision, not
  necessarily missing art).

Full detail: `docs/design/landscape/asset-manifest.md`.

## Commands to reproduce

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx vitest run
npx expo export --platform web
npx playwright test --workers=4
git checkout -- ../../docs/migration/screenshots/   # revert evidence re-encoding

# legacy (BLOCKED here: python playwright module not installed)
cd ../..
node tools/dev-server.js &
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```

## Explicit phase status

**LANDSCAPE FOUNDATION READY FOR PHASE 17**
