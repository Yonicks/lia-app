# Phase 16 Plan — Landscape Rebaseline and Design Contract

## Purpose

Create the durable source-of-truth and audit package required before any landscape UI implementation begins.

Phase 16 is deliberately documentation/audit-heavy.

It must prevent later agents from:

- treating landscape as “make portrait wider”;
- classifying landscape phones as tablets by long-edge width;
- preserving the old bottom navigation by accident;
- deleting features omitted from mocks;
- building against one 844×390 screenshot only;
- starting the old Phase 15 cutover.

## Entry conditions

- Existing React Native / Expo code is present under `apps/mobile/`.
- Historical Phase 14 and Phase 15 reports exist.
- Phase 15 did not retire Capacitor.
- Landscape reference images are committed under `docs/design/landscape/reference/`.
- Root agent rules exist.

## In scope

1. Verify the landscape rule/document structure is internally consistent.
2. Audit current child-facing navigation/orientation/responsive architecture.
3. Audit every current screen against the new landscape program.
4. Produce exact feature counts from current code.
5. Produce an asset availability/gap report.
6. Define the landscape web screenshot matrix for Phase 17.
7. Identify old tests that will become intentionally invalid once navigation/orientation changes.
8. Update migration documentation to point agents at the landscape program.
9. Create a Phase 16 report with evidence.

## Out of scope

- No broad UI redesign.
- Do not implement Home/Games/Practice mocks.
- Do not remove BottomNavigation yet.
- Do not change orientation behavior yet.
- Do not change responsive breakpoints yet.
- Do not rewrite game/practice/category UI.
- Do not alter domain logic.
- Do not perform native cutover.
- Do not delete Capacitor.

Small documentation/test-inventory helper scripts are allowed if useful, but production behavior should remain unchanged.

## Required audits

### 1. Current responsive model

Inspect:

- `apps/mobile/src/design-system/responsive/breakpoints.ts`
- `apps/mobile/src/design-system/responsive/useDevice.ts`
- `apps/mobile/src/design-system/responsive/useSafeLayout.ts`
- any direct `Dimensions` / `useWindowDimensions` usage in feature code
- any feature-local width/tablet conditions

Document:

- how 844×390 is currently classified;
- how 932×430 is currently classified;
- why long-edge width cannot be the future device-class basis;
- every file that bypasses centralized responsive helpers.

### 2. Current orientation model

Inspect:

- `apps/mobile/app.config.ts`
- `apps/mobile/src/services/orientation/*`
- every call site of the orientation service/API

Document:

- current route policy;
- current home/category behavior;
- current game/practice behavior;
- what Phase 17 must change to make the child app landscape-only.

### 3. Current navigation model

Inspect:

- Expo Router layouts/routes;
- `(tabs)/_layout.tsx`;
- `BottomNavigation`;
- `TopBar`;
- guarded parent navigation;
- deep-link behavior;
- back behavior tests.

Document:

- current top-level route graph;
- mounted-tab risks;
- exact replacement responsibilities for Phase 19.

### 4. Screen inventory

Create/update `docs/design/landscape/screen-map.md` with current implementation paths and intended migration phase.

No current surface may disappear from the inventory.

### 5. Feature counts

Read current code and record exact counts:

- registered games;
- practice modes;
- vocabulary categories including synthetic/custom behavior;
- parent tabs/features;
- reward/sticker surfaces.

Do not rely on old docs for counts.

### 6. Asset audit

Inspect current relevant asset registries/directories.

Update `docs/design/landscape/asset-manifest.md` so each required asset family is one of:

- EXISTING
- VERIFY
- NEEDED
- DESIGN-BLOCKED
- OPTIONAL

Where possible include exact current paths.

Do not create fake production art.

### 7. Test matrix

Define the Phase 17 landscape viewport matrix.

At minimum evaluate:

- 667×375
- 740×360
- 844×390
- 932×430
- 1024×768
- 1133×744
- 1280×800
- 1366×1024

Do not implement the new classifier yet.

Document which current portrait projects/tests will intentionally change later and which behavioral assertions must remain.

## Deliverables

Phase 16 should leave:

- root agent rules present and cross-linked;
- design contract present;
- reference images present;
- `docs/design/landscape/screen-map.md` audited;
- `docs/design/landscape/interaction-map.md` audited;
- `docs/design/landscape/asset-manifest.md` audited;
- `docs/migration/landscape-roadmap.md` audited;
- `docs/migration/phase-16-audit.md`;
- `docs/migration/phase-16-report.md`.

## `phase-16-audit.md` required sections

1. Repository baseline
2. Responsive findings
3. Orientation findings
4. Navigation findings
5. Complete screen inventory
6. Feature counts
7. Asset gaps
8. Test matrix / old-test impact
9. Risks for Phase 17
10. Explicit “no production UI behavior changed” statement

## Acceptance criteria

- [ ] Landscape references are committed and readable.
- [ ] `AGENTS.md`, `CLAUDE.md`, and Cursor rules point to the same canonical contract.
- [ ] Exact current game count documented from code.
- [ ] Exact current practice count documented from code.
- [ ] Current vocabulary/category behavior documented from code.
- [ ] Every current child/parent/global surface has a landscape migration destination.
- [ ] Current width-only device classification issue is demonstrated with examples.
- [ ] Every direct responsive-system bypass is listed.
- [ ] Current route/orientation policy is documented.
- [ ] Current top-level tab/navigation architecture is documented.
- [ ] Old test expectations that will intentionally change are listed without weakening them yet.
- [ ] Asset manifest contains concrete paths/statuses where discoverable.
- [ ] Phase 17 viewport matrix is frozen or any deviation is justified.
- [ ] No production behavior was changed.
- [ ] Legacy Capacitor implementation remains untouched.
- [ ] `docs/migration/phase-16-audit.md` exists.
- [ ] `docs/migration/phase-16-report.md` exists.

## Validation

Because Phase 16 should not change production behavior, run enough checks to prove the baseline remains green:

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx vitest run
npx expo export --platform web
```

If practical, run the existing Playwright baseline as evidence. Do not change failing expectations just to make the phase green.

Also run the legacy regression commands defined by the existing migration validation contract if the local environment supports them.

## Exit condition

Phase 16 ends with an explicit:

`LANDSCAPE FOUNDATION READY FOR PHASE 17`

or

`BLOCKED`

Then stop.
