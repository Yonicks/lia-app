# Phase 28 Plan — Intro, Overlays, Ads, Accessibility, and Global Polish

## Purpose

Finish the global landscape product surfaces and cross-cutting policies that are not owned by individual hubs/features, then prove the product is complete enough to enter real-device release QA.

This phase owns the Yonicks/Talki opening sequence, splash/loading/fallback surfaces, shared overlays, completion/reward feedback, ad placement architecture, accessibility/reduce-motion behavior, status-bar/safe-area polish, and removal of remaining reachable portrait child UI.

## Dependency

Read `docs/migration/phase-27-report.md` first.

Phase 28 may begin only when Phase 27 ends with:

`REWARDS AND PARENT READY FOR PHASE 28`

Otherwise stop as BLOCKED.

## In scope

1. Landscape-native splash/launch/intro/bumper behavior.
2. Loading, empty, error, not-found, and deep-link fallback surfaces.
3. Shared toast/feedback/reward/completion/done overlays.
4. Global animation and reduce-motion policy.
5. Accessibility audit and corrections across all migrated landscape screens.
6. Status bar, safe areas, notches/cutouts, keyboard/global inset polish.
7. Explicit route-aware ad placement architecture and policy.
8. Global audio/music state polish where shared chrome/intro transitions require it.
9. Remove/dead-code any remaining reachable portrait child experience in Expo.
10. Full product visual consistency sweep across compact phones and tablets.

## Out of scope

- Do not perform the Phase 29 real-device release gate in this phase.
- Do not cut over or retire Capacitor.
- Do not rewrite game/practice/domain logic for cosmetic reasons.
- Do not introduce new monetization products or ad formats not already approved/currently supported.

## Intro / opening sequence

Preserve current Yonicks Studios/Talki opening behavior and timing contracts unless a documented current bug exists.

Requirements:

- landscape-safe on phones/tablets;
- no portrait flash before/after intro;
- deep-link-after-intro still lands correctly;
- sound/music transitions respect current user setting;
- reduce-motion mode has a functional low-motion fallback;
- launch/intro never depends on web-only behavior.

## Global feedback surfaces

Audit and migrate all global/transient UI, including as present in current source:

- toast host;
- correct/incorrect feedback;
- reward/star/sticker celebration;
- game/practice done cards;
- loading indicators;
- permission/error dialogs;
- parent gate modal/overlay remnants;
- fallback/not-found/deep-link error surfaces.

Overlays must:

- stay within safe areas;
- not block required navigation indefinitely;
- work at 667×375 without clipping;
- remain readable in Hebrew RTL;
- respect reduce-motion where animated.

## Ad placement architecture

The current root-level ad behavior must be audited. A global banner rendered blindly below every route is not an acceptable landscape architecture if it consumes or overlays critical play space.

Create one explicit, testable ad-placement policy/service/component layer that answers:

- which routes/surface states are eligible for banner ads;
- where reserved ad space lives;
- when a banner must be suppressed because there is no compliant placement;
- how ad loading/failure affects layout;
- whether intro/app-open advertising is currently enabled and how it interacts with the opening sequence.

### Non-negotiable ad layout rules

- ads may never overlay active child controls/game objects;
- ad loading/failure may not cause disruptive content jumps;
- the core landscape shell may not be uniformly shrunk to compensate for an always-on banner;
- active gameplay/practice detail surfaces require an intentional policy, not accidental inheritance from root layout;
- no new ad format is added in this phase;
- test/demo ad IDs remain separated from production IDs according to current app configuration.

If current commercial requirements conflict with a safe landscape placement and source/docs do not resolve the conflict, document it as `PRODUCT-BLOCKED` and end Phase 28 BLOCKED rather than guessing.

Create/update a durable policy document, for example:

`docs/design/landscape/ad-placement-policy.md`

Exact path may follow existing documentation conventions.

## Accessibility

Audit all migrated screens for:

- accessible labels/roles on interactive controls;
- meaningful Hebrew labels rather than image-only actions;
- >=48×48 child-facing effective targets;
- focus order on web/test surface where meaningful;
- no critical information conveyed only by color;
- reasonable text scaling behavior without catastrophic clipping;
- screen-reader-safe decorative images;
- reduced-motion support.

Do not make the toddler UI visually desktop-like for accessibility; improve semantics and hit areas while preserving product design.

## Reduce motion

Provide one centralized preference path for animations that can be reduced/disabled. At minimum cover:

- intro/bumper motion;
- page transitions where custom animated;
- celebration/reward motion;
- decorative looping/moving world elements if present.

Core interaction feedback must remain understandable when motion is reduced.

## Global landscape sweep

Search the entire Expo app for:

- reachable portrait child screens;
- old bottom-nav remnants;
- direct Dimensions/width breakpoints bypassing centralized metrics;
- stretched raster assets;
- hard-coded portrait coordinates;
- duplicate top chrome/parent controls;
- unsupported vertical child hub scrolling;
- status bar/safe-area inconsistencies.

Fix within phase scope and record deliberate exceptions.

## Tests

Run full active landscape Playwright matrix and relevant native tests.

Add/verify:

- intro → Home;
- intro → deep link;
- reduce-motion intro/celebration;
- toast/done/reward overlays on compact phone;
- loading/error/not-found;
- ad eligible/ineligible routes;
- ad load/failure layout stability;
- accessibility semantics/touch targets where automated checks exist;
- no reachable bottom navigation/portrait child route.

Capture representative final-product screenshots for every major surface class.

## Acceptance criteria

- [ ] Intro/splash/global launch flow is landscape-safe.
- [ ] Deep-link-after-intro behavior is preserved.
- [ ] Global overlays/feedback are landscape-safe.
- [ ] Central reduce-motion policy exists and key animations honor it.
- [ ] Accessibility sweep is completed with documented evidence/exceptions.
- [ ] Route-aware ad placement policy exists and does not accidentally overlay/shrink active content.
- [ ] Ad loading/failure does not destabilize layout.
- [ ] No old bottom-nav child experience remains reachable.
- [ ] No portrait child UI remains reachable in the Expo product.
- [ ] No known direct responsive/orientation bypass remains without documented justification.
- [ ] Compact phone and tablet global visual sweep passes.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-28-report.md` exists.

## Product Completion Gate

The report must prove:

- all child/parent/reward/global surfaces have landscape destinations;
- monetization placement is explicit;
- accessibility/reduce-motion are addressed;
- no known portrait child product path remains;
- all prior phase blockers required for release are resolved or explicitly make the gate fail.

## Exit condition

End with exactly one of:

`PRODUCT COMPLETION GATE PASSED`

or

`BLOCKED`

Then stop.
