# Talki — Agent Instructions

These instructions are the repository-wide contract for AI-assisted development.

They apply to Claude, Cursor, Codex, and any other coding agent working in this repository.

## Repository state and source-of-truth order

Talki is in the middle of a React Native / Expo migration. The native application lives under:

`apps/mobile/`

The original Capacitor/PWA application still exists at the repository root and must remain intact until an explicit release cutover phase.

When sources disagree, use this priority:

1. **Current source code** — behavioral/implementation truth.
2. **Current active phase plan** — scope and acceptance truth.
3. **Committed landscape references** — visual truth for the redesign.
4. **Current phase reports** — evidence about what was actually completed.
5. Older migration/design documents — historical context only.

Do not implement from stale documentation without checking the current code.

## Current product direction

The next program is the **Talki Landscape Redesign**.

Talki's child-facing application is being redesigned as a landscape-only experience for phones and tablets.

The redesign begins at **Phase 16**.

The existing Phase 15 attempt is historical: it intentionally stopped because the release gate was NO-GO. It did **not** authorize Capacitor retirement.

Read:

- `docs/design/landscape/README.md`
- `docs/migration/landscape-roadmap.md`
- the active phase plan under `docs/migration/phases/`

---

# LANDSCAPE REDESIGN NON-NEGOTIABLES

1. Talki child-facing UI is **LANDSCAPE ONLY** on supported phones and tablets.

2. Do not create, preserve, or optimize a portrait child UI.

3. The committed references under `docs/design/landscape/reference/` are the visual source of truth for the new design.

4. The references are inspiration/targets, not production screenshots. Never place a whole mock screenshot into the app and call the screen implemented.

5. Current source code is the behavioral source of truth.

6. Never remove an existing game, vocabulary category, practice mode, reward feature, parent feature, audio behavior, progress behavior, or persistence behavior merely because it is absent from a visual mock.

7. Preserve existing domain logic, reducers, scoring, session logic, progress, storage, audio/TTS, recording, speech recognition, and data contracts unless the active phase explicitly requires a behavioral change.

8. The redesigned child experience must **not** use the old `BottomNavigation`.

9. Orientation policy must be centralized. Individual screens/components must not call orientation lock APIs directly.

10. Responsive/device classification must be centralized.

11. Do not scatter `Dimensions.get()`, `useWindowDimensions()`, arbitrary width breakpoints, or `isTablet = width > ...` checks throughout feature components.

12. Feature components must consume the shared landscape layout/metrics system.

13. Device classification for landscape must consider the short edge/usable geometry, not width alone. A landscape phone must never become a tablet merely because its long edge is wider than 768 px.

14. Do not build separate phone and tablet applications or duplicate complete screen implementations unless the active phase explicitly proves this unavoidable.

15. Use Hebrew RTL and logical start/end positioning. Do not hand-mirror layouts with brittle left/right hacks.

16. Child-facing controls require a minimum effective touch target of 48×48 dp.

17. Never stretch raster artwork. Backgrounds must use an intentional cover/crop/focal-point strategy.

18. Text, buttons, progress bars, navigation, cards, controls, and interactive surfaces must remain real React Native components.

19. Missing artwork is **DESIGN-BLOCKED**. Do not invent arbitrary placeholder art and report visual parity as complete.

20. Main child hubs should fit the intended landscape viewport. Do not solve landscape design by turning hubs into long portrait-like vertical scroll pages.

21. If all existing games/categories do not fit simultaneously, preserve reachability with an intentional paging or horizontal navigation pattern. Never silently drop content.

22. Tablet layouts should gain breathing room, art visibility, and sensible max sizes. Do not simply multiply every phone measurement by a tablet scale factor.

23. Do not modify, delete, or retire the legacy Capacitor application during landscape implementation phases.

24. Native cutover is a separate final release phase and requires an explicit release GO.

25. Tests may be updated when an intentional product/architecture decision invalidates an old expectation.

26. Never weaken, delete, skip, disable, or reduce test coverage merely to make CI green.

27. Every phase must implement only its defined scope, run its required validation, write its phase report, and **STOP** before beginning the next phase.

---

# Architecture principles

Prefer:

- shared shells;
- centralized responsive metrics;
- reusable visual primitives;
- pure domain logic;
- small focused screen components;
- explicit navigation contracts;
- explicit asset registries;
- data-driven card/catalog rendering;
- deterministic visual tests.

Avoid:

- magic numbers duplicated across screens;
- per-screen device rules;
- screen-specific orientation calls;
- duplicated phone/tablet trees;
- copying business logic into UI components;
- giant all-purpose components;
- accidental loss of existing feature reachability;
- visual decisions made only to satisfy Expo web.

The Expo web target is a testing surface. Native phone/tablet UX is the product target.

---

# Before modifying a feature

Before coding, inspect:

1. the active phase plan;
2. the previous landscape phase report;
3. the current feature implementation;
4. the related domain/reducer/store/service code;
5. existing tests and test IDs;
6. the relevant committed landscape reference;
7. the asset manifest and known design gaps.

Do not plan edits from filenames alone.

---

# Phase execution contract

For every landscape phase:

1. Read this file.
2. Read `docs/design/landscape/README.md`.
3. Read `docs/migration/landscape-roadmap.md`.
4. Read the active `docs/migration/phases/phase-XX-plan.md`.
5. Read the previous landscape phase report, if one exists.
6. Inspect the current code touched by the phase.
7. Produce a short pre-flight inventory before implementation.
8. Implement only that phase.
9. Run the acceptance/gate commands defined by the phase.
10. Capture the required screenshots/evidence.
11. Write `docs/migration/phase-XX-report.md`.
12. Stop.

If a required design asset, hardware capability, credential, or external dependency is unavailable, report the criterion as blocked/failed with evidence. Do not fake completion.

---

# Legacy and cutover safety

The legacy Capacitor/PWA implementation remains a supported migration fallback until the final cutover phase explicitly retires it.

Do not:

- delete `capacitor.config.ts`;
- delete the root `android/`, `ios/`, or `www/` migration artifacts as part of a redesign phase;
- pretend the Expo app has shipped when it has not;
- rewrite historical Phase 14/15 reports to make the old gate look green.

Historical reports are evidence and should remain historical.

---

# Reference locations

- Landscape design contract: `docs/design/landscape/README.md`
- Landscape screen inventory: `docs/design/landscape/screen-map.md`
- Landscape interactions: `docs/design/landscape/interaction-map.md`
- Landscape assets: `docs/design/landscape/asset-manifest.md`
- Landscape roadmap: `docs/migration/landscape-roadmap.md`
- Shared landscape prompt rules: `docs/migration/prompts/_landscape-shared.md`
