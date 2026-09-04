# Talki Landscape Design Contract

This directory defines the approved visual and interaction direction for the Talki landscape redesign.

It is intentionally separate from the old portrait/responsive migration references.

## Product target

Talki child-facing UI is:

- landscape only;
- Hebrew RTL;
- designed for young children;
- supported on phones and tablets;
- native-first (iOS and Android);
- implemented with one responsive architecture.

There is no portrait child layout to preserve.

## Source of truth

Visual reference order:

1. `reference/home.png`
2. `reference/games.png`
3. `reference/practice.png`
4. `reference/talki-landscape-master.*` (optional; not committed — see `reference/README.md`)

The cropped images are easier for an agent to inspect per screen. The optional master, if ever added, would preserve the original composite reference supplied for this redesign; its absence is not a gate failure.

These images define:

- visual language;
- hierarchy;
- card treatment;
- world/background style;
- general composition;
- control placement;
- density;
- child-friendly scale.

They do **not** authorize:

- embedding the screenshot as UI;
- deleting features not visible in the mock;
- hardcoding one viewport;
- stretching artwork;
- copying accidental mock inconsistencies.

Current application code remains the behavioral source of truth.

## Visual language

The landscape redesign uses a warm, premium, whimsical storybook world:

- painterly fantasy meadow / forest / castle environments;
- warm light and soft atmospheric depth;
- playful Talki purple branding;
- the yellow star mascot;
- large rounded white cards;
- soft shadows and highlights;
- glass/white translucent panels where appropriate;
- large child-friendly touch areas;
- minimal text;
- clear Hebrew labels;
- friendly rounded typography;
- no desktop-looking panels or dense enterprise UI.

## Shared child shell

Main child hubs share a coherent landscape shell:

- full-bleed world background;
- safe-area aware top utility controls;
- Talki logo/brand;
- star/reward count;
- parent/profile entry;
- music control;
- contextual side navigation;
- no bottom navigation.

The exact slot positions may vary slightly by screen if required by the reference, but the controls must feel like one system.

## Responsive philosophy

Landscape height is the scarce dimension.

When adapting to a compact landscape phone, reduce in this order:

1. outer whitespace;
2. inter-section gaps;
3. panel padding;
4. decorative spacing;
5. typography within approved minimums;
6. card dimensions within usable child touch sizes.

Do not remove content or introduce a long vertical page as the first solution.

Tablet layouts should preserve the same composition while gaining:

- breathing room;
- larger maximum content width;
- more visible artwork/background;
- slightly larger type/control scale;
- stronger spacing.

Do not turn a tablet into a completely different app.

## Home

Reference: `reference/home.jpg`

Required composition:

- world background;
- top Talki chrome;
- welcome/progress hero;
- yellow Talki mascot;
- visible progress bar/count;
- category strip;
- side navigation to the neighboring main child destinations.

The application has more categories than the number visible in the reference. All categories must remain reachable.

Default product direction:

- keep the one-row visual strip;
- allow horizontal/paged discovery;
- make the first viewport feel complete rather than like a clipped list.

## Games hub

Reference: `reference/games.jpg`

Primary composition:

- 3 columns × 2 rows;
- six large art-driven cards visible at once;
- white rounded card frame;
- image-dominant surface;
- Hebrew title footer;
- side navigation.

The current app has more than six games.

Default product direction:

- use horizontal paging/swiping between 3×2 pages;
- provide a child-friendly page indicator when there is more than one page;
- preserve reachability of every registered game;
- do not shrink all games into tiny cards to fit one screen.

## Practice hub

Reference: `reference/practice.jpg`

The current app has six practice modes, matching the reference.

Primary composition:

- 3 columns × 2 rows;
- title/subtitle area;
- six large art-driven practice cards;
- side navigation.

All six current practice modes remain present and keep their existing behavior.

## Detail screens and unmocked screens

Not every current screen has a dedicated landscape mock.

For unmocked child/detail screens:

- inherit the approved landscape visual system;
- preserve the current interaction/behavior;
- use the shared shell where appropriate;
- prefer horizontal composition over portrait stacking;
- document material UX invention in the phase report.

Do not invent a major new product flow without recording the decision.

Parent screens may be denser than toddler screens but remain landscape-only.

## Artwork

Reference art is not automatically a production asset.

Production art rules:

- keep high-resolution source assets;
- prefer purpose-built phone/tablet crops only when one crop cannot preserve focal content;
- use cover/crop/focal-point behavior;
- never stretch;
- record missing assets in `asset-manifest.md`;
- mark missing required art as DESIGN-BLOCKED instead of silently substituting low-quality placeholders.

## Accessibility and touch

- Hebrew RTL throughout.
- Minimum effective child touch target: 48×48 dp.
- No child-critical action may depend only on a subtle gesture.
- Paging must also have an obvious/tappable affordance where useful.
- Text must remain legible on the painterly background.
- Respect reduce-motion in shared/global animation systems.

## Ads

Landscape has limited vertical height.

The existing global banner placement must not simply be carried forward without a layout decision.

The landscape program must explicitly decide:

- which screens show banners;
- whether gameplay screens are ad-free;
- reserved banner height;
- placement relative to safe areas and side navigation.

Until that policy is approved in a phase plan, do not distort the reference layout to make room for an inherited banner.

## Validation philosophy

Visual validation should compare multiple landscape device classes, not one screenshot:

- compact phone;
- modern phone;
- large phone;
- tablet;
- large tablet where practical.

A screen is not complete because it matches one 844×390 reference if it clips or misclassifies a 932×430 phone or 1024×768 tablet.
