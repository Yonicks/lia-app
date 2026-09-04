# Talki Landscape Interaction Map

This file records the intended high-level interaction model for the landscape child experience.

## Main child navigation

The old bottom navigation is removed from the redesigned child experience.

Main child destinations are:

- Home
- Games
- Practice
- Rewards (through the star/reward control)
- Parent center (through the guarded parent/profile control)

Home, Games, and Practice use contextual side navigation in the visual language shown by the references.

Top-level switching should not build an endlessly growing back stack.

Detail screens (category/game/practice mode) continue to use normal back/navigation semantics.

## Top utility controls

Shared child chrome exposes stable actions:

### Music

- toggles the existing music setting;
- uses the current audio/settings behavior;
- must remain reachable on all main child hubs.

### Parent/profile

- enters the existing guarded parent flow;
- short/long press behavior must follow current product behavior until an active phase explicitly changes it;
- exactly one active parent-entry control should exist in a screen tree.

### Stars/rewards

- displays current points/stars;
- opens the rewards/stickers destination;
- retains current progress/reward data.

  Current-code note (Phase 16 audit): `TopBar`'s points pill
  (`src/components/shell/TopBar.tsx`) is display-only today —
  `accessibilityRole="image"`, no `onPress`. Rewards is reached only
  through `BottomNavigation`'s "stickers" tab. Once Phase 19 removes
  `BottomNavigation`, this control must become interactive or Rewards
  reachability regresses.

### Talki branding

- visual brand anchor;
- must not accidentally become a second duplicate parent trigger unless the active phase specifies that behavior.

## Home interactions

- Hero/progress continues from current learning progress.
- Category cards open the selected category.
- Category strip supports all categories.
- If paging/horizontal scrolling is required, it must be child discoverable.
- Side navigation opens Games / Practice according to the approved shell.

## Games interactions

- 3×2 page of large game cards.
- Tap opens the existing game route/session.
- Horizontal swipe/page control moves between game pages.
- All registered games remain reachable.
- Page navigation must not conflict with an individual game gesture after entering a game.

## Practice interactions

- Six cards in one 3×2 hub.
- Tap opens the existing practice mode.
- Current category/practice gating rules remain intact.

## Back behavior

Child behavior should be deterministic:

- detail -> previous logical child surface;
- top-level hub -> should not accidentally exit because of stacked/inactive tab screens;
- hardware back must be tested on native devices;
- rapid back presses must not strand the app on a blank/duplicate UI tree.

## Orientation

The supported child UI is landscape-only.

Orientation is enforced by the centralized orientation service/policy, not individual screens.

Rotation attempts must be verified on real iPhone, Android phone, iPad, and Android tablet during the release gate.

## Paging

Paging is allowed where the domain contains more content than the reference viewport.

Rules:

- keep large child-friendly cards;
- prefer page-sized groups over shrinking every card;
- show position/availability of another page;
- preserve RTL expectations;
- test swipe direction and arrow semantics in Hebrew RTL;
- make core navigation possible without relying solely on a gesture.

## Parent forms / software keyboard

Parent screens remain landscape.

On phone landscape, forms must remain usable when the software keyboard consumes much of the short edge.

Use controlled scrolling/insets for parent forms where necessary; do not apply toddler hub "no vertical scroll" rules blindly to forms.
