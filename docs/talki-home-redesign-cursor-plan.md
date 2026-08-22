# Talki Home Redesign — Full Cursor Implementation Plan

> **Goal:** Rebuild the Talki Home screen to closely match the approved redesign while preserving all current Talki behavior, state, navigation, progress, audio controls, categories, practice flows, games, achievements, and settings.
>
> **Execution model:** Run this plan in Cursor **one phase at a time**. Each phase below contains exact implementation guidance, layout tokens, colors, spacing, validation requirements, and a ready-to-paste Cursor run prompt.
>
> **Visual source of truth:** `docs/design/talki-home-approved.png`
>
> **Functional source of truth:** the current Talki repository.

---

# 1. Governing Rules

## 1.1 Two sources of truth

```text
APPROVED MOCKUP
    ↓
Visual hierarchy, composition, spacing, color, proportions, artwork placement

CURRENT TALKI APP
    ↓
Business logic, state, routing, data, progress, audio, games, settings

FINAL IMPLEMENTATION
    ↓
Approved visual design + existing real functionality
```

Never replace working behavior with mocked values just to make the screenshot look right.

Never hardcode progress, points, categories, routes, last-learning state, or game state if real values already exist.

---

# 2. Reference Image Setup

Place the approved design image in the repo before the implementation run:

```text
docs/design/talki-home-approved.png
```

Every visual phase must compare the rendered Home page against this reference.

Do **not** reproduce the screenshot with absolute-positioned pixel art. Recreate it as responsive React/UI.

---

# 3. Target Home Architecture

Adapt to the repository conventions, but the Home page should conceptually end up like:

```tsx
<HomePage>
  <HomeHeader />
  <WelcomeHero />
  <ContinueLearningCard />
  <CategoriesSection />
  <SpeechPracticeSection />
  <GamesSection />
  <BottomNavigation />
</HomePage>
```

Potential organization:

```text
src/features/home/
  HomePage.tsx
  HomePage.module.css
  home.constants.ts
  home.types.ts

  components/
    HomeHeader/
    WelcomeHero/
    ContinueLearningCard/
    CategoriesSection/
    CategoryCard/
    SpeechPracticeSection/
    PracticeCard/
    GamesSection/
    GameCard/

  hooks/
    useHomeProgress.ts
    useContinueLearning.ts
```

Do not force this structure if Talki already has a good equivalent.

---

# 4. Asset Strategy

## 4.1 Build these as real UI

Use HTML/CSS/React/SVG for:

- Hebrew text
- section headings
- buttons
- cards
- progress bars
- progress rings
- points and percentages
- badges
- arrows
- bottom navigation
- active/selected states
- gradients
- shadows
- borders

## 4.2 Generate only illustration assets

Use ChatGPT/image generation only for:

- Talki mascot poses
- hero scenery
- category illustrations
- game illustrations
- decorative flowers/clouds
- specialized Talki pictograms where no suitable asset exists

## 4.3 Never bake UI text into generated artwork

No generated image should contain:

- Hebrew
- English
- letters
- numbers
- labels
- progress values
- game titles
- buttons

## 4.4 Missing-assets file

Cursor must maintain:

```text
docs/talki-home-missing-assets.md
```

Format each request as:

```md
## <filename>

Status: Missing
Phase: <phase>
Priority: High | Medium | Low

Purpose:
...

Canvas:
...

Background:
Transparent | Opaque

Style:
Talki V2 premium children's educational illustration.

Palette:
...

Composition:
...

Must contain:
...

Must NOT contain:
- Hebrew text
- English text
- letters
- numbers
- UI labels
- watermark
```

Do not leave emoji as production placeholders.

---

# 5. Global Design Tokens

These values are the **baseline implementation values**. Cursor may tune by roughly **2–4 px** after Playwright comparison, but should not introduce arbitrary per-component values.

## 5.1 Color palette

```css
--talki-purple-900: #44206F;
--talki-purple-800: #542780;
--talki-purple-700: #6D3BA6;
--talki-purple-600: #7C4CD6;
--talki-purple-500: #9366E5;
--talki-purple-200: #DED0FA;
--talki-purple-100: #EEE6FF;
--talki-purple-050: #F7F2FF;

--talki-mint-500: #8FD3C1;
--talki-mint-200: #CFEDE5;
--talki-mint-100: #EAF8F4;

--talki-pink-500: #F46B91;
--talki-pink-300: #FFA8C2;
--talki-pink-200: #FFD9E6;
--talki-pink-100: #FFF0F5;

--talki-peach-500: #FFB977;
--talki-peach-300: #FFCDA1;
--talki-peach-100: #FFF1E2;

--talki-gold-500: #FFD75A;
--talki-gold-300: #FFE796;
--talki-gold-100: #FFF8DC;

--talki-blue-500: #69B7EF;
--talki-blue-200: #CFEAFB;
--talki-blue-100: #EEF8FF;

--talki-green-500: #79CFAE;
--talki-green-100: #EAF8F1;

--talki-bg: #FFF9EF;
--talki-surface: #FFFFFF;
--talki-surface-soft: #FFFCF8;

--talki-text-primary: #241735;
--talki-text-heading: #4E2A72;
--talki-text-secondary: #746887;
--talki-text-muted: #9B91A7;

--talki-border-soft: #F1E7D7;
--talki-track: #F3EEE6;
```

## 5.2 Primary gradient

Use mainly for the hero CTA and premium selected controls:

```css
background: linear-gradient(135deg, #7C4CD6 0%, #6D3BA6 100%);
```

Do not put gradients on every surface.

---

# 6. Typography

Reuse the existing Talki Hebrew font if one is already configured.

At a ~390 px viewport, use this baseline hierarchy:

```css
--font-hero-title: 30px;
--font-section-title: 22px;
--font-card-title: 17px;
--font-body: 14px;
--font-small: 12px;
--font-meta: 11px;
```

Weights:

```css
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-extra-bold: 800;
```

Recommended line heights:

```text
Hero title:    1.08–1.12
Section title: 1.20
Card title:    1.20
Body:          1.35
Small/meta:    1.25
```

Rules:

- Keep section headings visually above card titles.
- Use secondary purple/gray for descriptions rather than black.
- Avoid more than 5–6 font-size levels on Home.
- Do not shrink Hebrew to unreadable sizes just to fit a card.

---

# 7. Global Spacing

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

Home defaults:

```css
--home-padding-inline: 16px;
--home-section-gap: 28px;
--home-card-gap: 12px;
--home-grid-gap: 12px;
```

At 430 px+:

```css
--home-padding-inline: 18px;
--home-grid-gap: 14px;
```

Tablet:

```css
--home-padding-inline: 24px;
```

Avoid arbitrary spacing like 17/23/31 px unless screenshot matching clearly demands it.

---

# 8. Corner Radius

```css
--radius-control: 14px;
--radius-icon: 16px;
--radius-card: 22px;
--radius-card-large: 26px;
--radius-hero: 30px;
--radius-pill: 999px;
```

Usage:

```text
Header utility controls: 14–16 px
Icon tiles:              16 px
Category cards:          20–22 px
Continue card:           24–26 px
Hero:                    28–32 px
CTA:                     pill
Bottom active item:      18–24 px / pill
```

---

# 9. Shadows

Use only three shadow levels:

```css
--shadow-sm: 0 2px 6px rgba(65, 39, 26, 0.06);
--shadow-card: 0 6px 16px rgba(73, 46, 25, 0.09);
--shadow-floating: 0 10px 28px rgba(73, 46, 25, 0.13);
```

No harsh black shadows.

---

# 10. Responsive Targets

Mandatory visual validation widths:

```text
375 px
390 px
430 px
768 px
```

Recommended max Home width:

```css
max-width: 760px;
margin-inline: auto;
```

The tablet layout should stay centered instead of stretching every card across the whole screen.

---

# 11. RTL Rules

Use the app's existing RTL strategy when possible.

Preferred high-level pattern:

```tsx
<main dir="rtl">
```

Avoid random nested `direction: rtl` / `direction: ltr` overrides.

Validate:

- section heading alignment
- grid order
- arrow direction
- icon placement
- progress metadata
- navigation order
- hero text placement

---

# 12. Playwright Visual Validation

Create:

```text
artifacts/talki-home-redesign/
```

Required screenshots:

```text
00-before-390.png
01-foundation-390.png
02-header-390.png
03-hero-390.png
04-continue-390.png
05-categories-390.png
06-practice-390.png
07-games-390.png
08-navigation-390.png
09-final-375.png
09-final-390.png
09-final-430.png
09-final-768.png
09-final-fullpage.png
```

Every visual phase must follow:

```text
Inspect
  ↓
Implement
  ↓
Run app
  ↓
Screenshot
  ↓
Compare to approved mockup
  ↓
Fix
  ↓
Screenshot again
  ↓
Functional check
  ↓
Proceed
```

Compilation alone is never sufficient.

---

# PHASE 0 — Repository Audit

## Goal

Understand the existing Home implementation before changing visuals.

## Cursor must inspect

- Home route
- Home page component
- shared shell/layout
- bottom navigation
- header
- state management
- points
- last lesson/category
- progress calculations
- categories/config
- practice modes
- games
- audio/music state
- speech speed/playback state
- rewards
- settings
- achievements
- RTL setup
- theme/tokens
- existing assets

## Deliverable

Create:

```text
docs/talki-home-redesign-audit.md
```

Include:

```md
# Existing Home Architecture

## Route
...

## Main component
...

## Shared layout
...

## State/data sources
...

## Existing reusable components
...

## Existing reusable assets
...

## Category model
...

## Continue-learning behavior
...

## Audio/music behavior
...

## Practice routes
...

## Game routes
...

## Risks
...

## Recommended refactor boundary
...
```

Capture:

```text
artifacts/talki-home-redesign/00-before-390.png
```

## Do not

- redesign UI
- change APIs
- replace stores
- remove existing components
- refactor unrelated features

## Done when

- all Home functionality is mapped
- reusable assets are inventoried
- baseline screenshot exists
- implementation boundaries are documented

## CURSOR RUN 1 — PHASE 0

```text
Execute ONLY Phase 0 of docs/talki-home-redesign-plan.md.

Audit the current Talki Home implementation before changing any UI.

Find and document:
- Home route and page component
- page shell/layout
- header and bottom navigation
- real points source
- learning-progress source
- Continue Learning logic
- category source/config and ordering
- practice modes and routes
- games and routes
- audio/music state
- speech/playback speed controls
- rewards
- achievements/settings navigation
- RTL strategy
- existing visual tokens
- all potentially reusable Talki assets

Create docs/talki-home-redesign-audit.md.

Run the current app and capture a 390 px baseline screenshot at:
artifacts/talki-home-redesign/00-before-390.png

Do not redesign anything in this run.

Stop after Phase 0 and report:
1. files discovered
2. state sources
3. reusable assets
4. technical risks
5. recommended implementation boundaries
```

---

# PHASE 1 — Foundation and Shared Tokens

## Goal

Create the common visual foundation without redesigning the full screen yet.

## Implement

- Home background
- content container
- shared design tokens
- shared spacing
- card primitive
- section heading primitive
- optional icon-tile primitive
- progress primitive if genuinely reusable
- responsive container
- RTL-safe layout

## Home background

Preferred baseline:

```css
background:
  radial-gradient(
    circle at 50% 0%,
    rgba(255,255,255,0.92) 0%,
    rgba(255,249,239,0.96) 34%,
    #FFF9EF 100%
  );
```

A plain `#FFF9EF` is acceptable if it fits the existing design system better.

## Home page spacing

At 390 px:

```css
padding-inline: 16px;
padding-top: 8px;
padding-bottom: 100px; /* refined after bottom nav */
```

Default section gap:

```css
28px
```

## Shared card

```css
background: #FFFFFF;
border: 1px solid #F1E7D7;
border-radius: 22px;
box-shadow: 0 6px 16px rgba(73,46,25,0.09);
```

Remove/reduce the border if screenshot comparison shows the cards are too outlined.

## Shared section heading

```css
font-size: 22px;
font-weight: 800;
line-height: 1.2;
color: #4E2A72;
margin-bottom: 12px;
```

## Validation

Save:

```text
01-foundation-390.png
```

## Done when

- tokens centralized
- spacing consistent
- shared card treatment exists
- responsive Home container works
- RTL remains correct
- no behavior broken

## CURSOR RUN 2 — PHASE 1

```text
Execute ONLY Phase 1 of docs/talki-home-redesign-plan.md.

Implement the shared visual foundation for the approved Talki Home redesign.

Requirements:
- reuse existing theme infrastructure where possible
- add centralized Talki Home tokens only where needed
- use the exact baseline palette, spacing, radii, typography and shadow system from the plan
- implement the responsive Home content container
- preserve RTL
- create only genuinely reusable primitives such as HomeCard and SectionHeading
- do not redesign Header/Hero/Categories/etc yet
- do not change business logic

Run the app at 390 px and save:
artifacts/talki-home-redesign/01-foundation-390.png

Compare against docs/design/talki-home-approved.png.

Stop after Phase 1 and report files changed and any intentional token deviations.
```

---

# PHASE 2 — Top Header

## Goal

Rebuild the header to match the approved design while preserving real controls.

## Visual anatomy

```text
[ gift ] [ music ] [ speech ]      [ points ⭐ ]      Talki ⭐
                                                   Hebrew tagline
```

## Header baseline

At 390 px:

```css
min-height: 72px;
padding-block: 8px;
gap: 10px;
```

Target maximum height: roughly 84 px.

## Utility button

```css
width: 44px;
height: 44px;
border-radius: 14px;
background: #FFFFFF;
border: 1px solid #F1E7D7;
box-shadow: var(--shadow-sm);
```

Icon:

```css
width: 24px;
height: 24px;
```

Allow 42–48 px button tuning from screenshot comparison.

## Brand

Talki wordmark if rendered as text:

```css
font-size: 28px;
font-weight: 800;
line-height: 1;
color: #6D3BA6;
```

Tagline:

```css
font-size: 11px;
font-weight: 500;
color: #746887;
margin-top: 4px;
```

Star/brand mascot display:

```text
40–46 px
```

Prefer an official brand asset if present.

## Points badge

```css
min-width: 72px;
height: 46px;
padding-inline: 12px;
border-radius: 18px;
background: #FFFFFF;
border: 1px solid #F1E7D7;
box-shadow: var(--shadow-sm);
```

Number:

```css
font-size: 17px;
font-weight: 800;
```

Label:

```css
font-size: 10px;
color: #6D3BA6;
```

Star:

```text
18–20 px
```

## Functional requirements

Preserve real:

- rewards
- music
- speech/playback/speed control
- points value

Do not hardcode `0`.

## Potential assets

```text
talki-ui-gift.png
talki-ui-music.png
talki-ui-speech.png
talki-brand-star.png
```

Preferred source: 512×512 transparent PNG.

## Interaction

Each utility control must:

- be a real button
- have accessible label
- preserve current handler
- expose active/pressed state when applicable
- have focus-visible state

## Validation

Save:

```text
02-header-390.png
```

Compare:

- top whitespace
- control size
- spacing
- brand position
- points position
- overall header visual weight

## Done when

- controls work
- points dynamic
- no emoji placeholders
- no overflow at 375 px
- hierarchy matches reference

## CURSOR RUN 3 — PHASE 2

```text
Execute ONLY Phase 2: Top Header.

Use docs/design/talki-home-approved.png as the visual source of truth and the current app as the functional source of truth.

Implement:
- Talki brand area
- star/brand artwork
- subtitle/tagline
- real points badge
- gift/reward control
- music control
- speech/playback/speed control according to existing behavior

Use the plan's exact baseline size, color, padding, radius and shadow specifications.

Do not hardcode points.
Do not use emoji in the final implementation.
Do not replace existing handlers.

If final artwork is missing, log it in docs/talki-home-missing-assets.md with a complete generation spec.

Validate at 375, 390 and 430 px.

Save:
artifacts/talki-home-redesign/02-header-390.png

Perform at least one screenshot comparison/fix iteration before stopping.
```

---

# PHASE 3 — Welcome Hero

## Goal

Implement the large illustrated Welcome banner as the page's visual anchor.

## Hero container

At ~390 px:

```css
width: 100%;
min-height: 190px;
border-radius: 28px;
overflow: hidden;
position: relative;
margin-top: 6px;
```

Target mobile height range:

```text
185–215 px
```

Tune through screenshots.

## Background artwork

Preferred:

```text
talki-home-hero-landscape.webp
```

Should include:

- blue sky
- soft clouds
- green hills
- flowers
- foliage
- tree
- premium Talki children's illustration style

No text.

CSS:

```css
position: absolute;
inset: 0;
width: 100%;
height: 100%;
object-fit: cover;
```

## Mascot

Preferred:

```text
talki-mascot-wave.png
```

Approximate mobile display width:

```text
110–130 px
```

Position on the left side, anchored toward the lower half.

## Hero content

Right side / RTL content region:

```css
position: relative;
z-index: 2;
width: 58–62%;
padding: 24px 18px 18px 14px;
```

Heading:

```css
font-size: 30px;
font-weight: 800;
line-height: 1.08;
color: #44206F;
```

Subtitle:

```css
font-size: 14px;
font-weight: 500;
line-height: 1.35;
color: #5F4776;
margin-top: 8px;
```

## CTA

```css
height: 52px;
min-width: 220px;
max-width: 100%;
padding-inline: 18px;
border-radius: 999px;
background: linear-gradient(135deg, #7C4CD6, #6D3BA6);
box-shadow: 0 8px 18px rgba(109,59,166,0.25);
margin-top: 14px;
```

Text:

```css
font-size: 17px;
font-weight: 800;
color: #FFFFFF;
```

Circular arrow area:

```css
width: 38px;
height: 38px;
background: #FFFFFF;
border-radius: 50%;
color: #6D3BA6;
```

Use the correct RTL arrow direction from the reference.

## Behavior

CTA must use existing Continue Learning logic.

Do not invent a replacement route.

## Responsive

375 px:

- keep heading readable
- reduce mascot slightly if collision occurs
- CTA may reduce width
- keep hero around ≥180 px

430 px:

- allow slightly more breathing room
- do not scale every child proportionally

768 px:

- keep max-height around 280–300 px unless reference comparison suggests otherwise

## Validation

Save:

```text
03-hero-390.png
```

Compare:

- hero height
- mascot scale
- mascot offset
- title location
- CTA width/height
- background crop
- border radius
- header-to-hero spacing

## Done when

- Hebrew is DOM text
- CTA is a real button
- no text in artwork
- responsive layout works
- real Continue behavior preserved

## CURSOR RUN 4 — PHASE 3

```text
Execute ONLY Phase 3: Welcome Hero.

Rebuild the approved illustrated hero as responsive real UI.

Use:
- separate hero landscape artwork
- separate Talki mascot artwork
- real Hebrew DOM text
- real CTA button
- existing Continue Learning behavior

Follow the exact baseline hero dimensions, padding, type sizes, colors, radius and CTA specifications from the plan.

Do not bake text into artwork.
Do not use the full screenshot as a hero image.

Search existing assets first.
If assets are missing, add complete High-priority requests to docs/talki-home-missing-assets.md.

Validate at 375, 390, 430 and 768 px.

Save:
artifacts/talki-home-redesign/03-hero-390.png

Compare visually against the approved mockup and refine before stopping.
```

---

# PHASE 4 — Continue Where We Stopped

## Goal

Implement the personalized continuation card below the hero.

## Container

At 390 px:

```css
margin-top: 16px;
min-height: 104px;
padding: 16px 18px;
border-radius: 24px;
background: #FFFFFF;
border: 1px solid #F1E7D7;
box-shadow: var(--shadow-card);
```

Visual structure should reproduce the reference with correct RTL ordering:

```text
arrow   progress ring   text content   category icon
```

## Category icon tile

```css
width: 58px;
height: 58px;
border-radius: 18px;
```

Artwork:

```css
width: 42px;
height: 42px;
object-fit: contain;
```

## Text

Eyebrow:

```css
font-size: 12px;
font-weight: 700;
color: #746887;
```

Category title:

```css
font-size: 22px;
font-weight: 800;
color: #241735;
margin-top: 2px;
```

Supporting line:

```css
font-size: 12px;
font-weight: 500;
color: #746887;
margin-top: 4px;
```

## Progress ring

```text
64×64 px
```

Track:

```text
#EEEAF3
```

Active:

```text
#B898F1 or #7C4CD6, whichever matches screenshot better
```

Stroke width:

```text
7–8 px
```

Center:

```css
font-size: 16px;
font-weight: 800;
color: #542780;
```

Implement using SVG or CSS conic-gradient, not an image.

## Arrow

Approximate:

```text
32×32 px
```

Use correct RTL direction.

## Real data

Must come from the existing app:

- last/current category
- percentage
- icon
- resume action

No hardcoded `חיות` or `0%`.

## Empty state

When no previous learning exists:

- use existing product behavior if present
- otherwise show a valid start-learning state
- route to the normal recommended/first learning flow

Do not show an undefined category.

## Test states

- 0%
- partial
- 100%
- no history
- long category name

## Validation

Save:

```text
04-continue-390.png
```

## Done when

- data dynamic
- resume works
- progress correct
- category icon shared with category system
- visual hierarchy matches reference

## CURSOR RUN 5 — PHASE 4

```text
Execute ONLY Phase 4: Continue Where We Stopped.

Implement the continuation card using actual Talki learning state.

Required dynamic values:
- current/last category
- category icon
- percentage
- resume destination

Use the plan's exact card size, padding, radius, type hierarchy, progress-ring size and icon-tile guidance.

Implement the progress ring using SVG/CSS, not an image.

Handle:
- no history
- 0%
- partial progress
- completed state
- long Hebrew category names

Preserve existing navigation logic.

Save:
artifacts/talki-home-redesign/04-continue-390.png

Compare to the approved design and fix visual discrepancies before stopping.
```

---

# PHASE 5 — Categories

## Goal

Build the central two-column Categories grid.

## Section spacing

```css
margin-top: 28px;
```

Heading bottom gap:

```text
12 px
```

## Grid

Mobile:

```css
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 12px;
```

430 px:

```css
gap: 14px;
```

Do not automatically switch to 4 columns on tablet if it destroys the mobile app feel.

## Category card

At ~390 px:

```css
min-height: 96px;
padding: 12px 14px 10px;
border-radius: 20px;
background: #FFFFFF;
border: 1px solid #F1E7D7;
box-shadow: var(--shadow-card);
position: relative;
```

## Icon tile

```css
width: 50px;
height: 50px;
border-radius: 16px;
```

Image:

```css
width: 36px;
height: 36px;
```

## Title

```css
font-size: 17px;
font-weight: 800;
line-height: 1.2;
color: #241735;
```

Long title such as `צבעים וצורות` may safely use 15–16 px through `clamp()` or responsive styles.

## Progress metadata

```css
font-size: 11px;
font-weight: 600;
color: #746887;
```

Gold star:

```text
14 px
```

## Progress bar

Track:

```css
height: 5px;
border-radius: 999px;
background: #F3EEE6;
```

Fill inherits the category accent.

## Accent mapping

```text
חיות            mint     #8FD3C1
אוכל             pink     #F46B91
בית              blue     #69B7EF
צבעים וצורות    purple   #9366E5
הגוף             pink     #F46B91
משפחה           peach    #FFB977
מספרים          gold     #FFD75A
פעולות           green    #79CFAE
רגשות            purple   #9366E5
בחוץ             blue     #69B7EF
המילים שלי       purple   #7C4CD6
```

## Category assets

Preferred names:

```text
category-animals.png
category-food.png
category-home.png
category-colors-shapes.png
category-body.png
category-family.png
category-numbers.png
category-actions.png
category-emotions.png
category-outside.png
category-my-words.png
```

Recommended source:

```text
512×512 transparent PNG
```

Display around 32–40 px depending on illustration shape.

No emoji in final production.

## My Words

Use the wide treatment:

```css
grid-column: 1 / -1;
min-height: 86px;
```

## Data

Reuse canonical category metadata if it already exists.

Keep category metadata separate from per-user progress.

## Test states

- 0/N
- partial
- complete
- N=0 where valid
- long Hebrew title
- missing optional metadata

## Interaction

Full card should be an appropriate large touch target.

Minimum interactive target:

```text
44×44 px
```

## Validation

Save:

```text
05-categories-390.png
```

Compare:

- card height
- grid gap
- icon scale
- title alignment
- progress labels
- progress bars
- My Words width
- cumulative page density

## Done when

- all categories preserved
- routes work
- real progress shown
- no emoji
- no overflow
- grid matches reference

## CURSOR RUN 6 — PHASE 5

```text
Execute ONLY Phase 5: Categories.

Build the complete Categories section as data-driven reusable UI.

Use:
- 2-column mobile grid
- shared CategoryCard
- the exact baseline card dimensions/padding/radius/shadow from the plan
- category accent mapping from the plan
- real category totals and user progress
- real routes
- full-width My Words card
- Talki-style artwork, not emoji

Do not duplicate category metadata if a canonical config already exists.

Search existing assets first.
Log missing final artwork in docs/talki-home-missing-assets.md, one entry per image.

Test 0%, partial, complete, long Hebrew title and My Words states.

Save:
artifacts/talki-home-redesign/05-categories-390.png

Visually compare and refine before stopping.
```

---

# PHASE 6 — Speech Practice

## Goal

Implement the three colorful Speech Practice cards.

## Section

Top gap:

```text
28 px
```

Heading:

```text
תרגול דיבור
```

## Card row

At ~390 px:

```css
display: grid;
grid-template-columns: repeat(3, minmax(0, 1fr));
gap: 10px;
```

Card:

```css
min-height: 118px;
padding: 12px;
border-radius: 22px;
box-shadow: var(--shadow-card);
```

If readability fails at 375 px, prefer a controlled horizontal carousel before making text tiny.

## Variants

### Focus Word

```text
Background: #FFD9E6 / subtle pink gradient
Accent:     #F46B91
Icon:       target
```

### Show Me

```text
Background: #DED0FA / subtle lavender gradient
Accent:     #7C4CD6
Icon:       pointing hand
```

### Finish Together

```text
Background: #FFCDA1 / subtle peach gradient
Accent:     #FF9C52
Icon:       pause/completion concept
```

## Icon tile

```css
width: 48px;
height: 48px;
border-radius: 16px;
background: rgba(255,255,255,0.75);
```

Artwork display:

```text
32–36 px
```

## Title

```css
font-size: 15px;
font-weight: 800;
color: #241735;
line-height: 1.2;
```

## Description

```css
font-size: 10.5px; /* up to 11px */
font-weight: 500;
color: #463A52;
line-height: 1.3;
```

Keep to roughly 2–3 short lines.

## Arrow control

```css
width: 28px;
height: 28px;
border-radius: 50%;
background: rgba(255,255,255,0.85);
```

## Data-driven model

```ts
type PracticeModeConfig = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: 'pink' | 'lavender' | 'peach';
  route: string;
};
```

Do not duplicate near-identical JSX three times.

## Assets

```text
practice-focus-word.png
practice-show-me.png
practice-finish-together.png
```

Recommended source: 512×512 transparent PNG.

## Functional requirements

Each card must open the existing correct practice flow.

No placeholder routes.

## Validation

Save:

```text
06-practice-390.png
```

Specifically check 375 px readability.

## Done when

- all modes work
- shared component used
- text readable
- colors match reference
- no emoji final assets

## CURSOR RUN 7 — PHASE 6

```text
Execute ONLY Phase 6: Speech Practice.

Implement:
- section heading
- Focus Word
- Show Me
- Finish Together

Use one reusable PracticeCard with configuration data.

Follow the plan's exact color variants, card dimensions, padding, type sizes, icon tile size and responsive rules.

Preserve all existing routes and behavior.

Do not use emoji in the final UI.
Log missing illustrations if necessary.

Validate at 375, 390 and 430 px with emphasis on readability.

Save:
artifacts/talki-home-redesign/06-practice-390.png

Compare against the approved design and refine before stopping.
```

---

# PHASE 7 — Games

## Goal

Implement the illustrated game cards.

## Section spacing

```text
28 px from previous section
```

## Layout

At ~390 px:

```css
display: grid;
grid-template-columns: repeat(3, minmax(0, 1fr));
gap: 10px;
```

At 375 px, use horizontal scrolling if necessary rather than unreadably narrow cards.

## Card ratio

```css
aspect-ratio: 1.55 / 1;
border-radius: 18px;
overflow: hidden;
position: relative;
box-shadow: var(--shadow-card);
```

## Game artwork

Runtime names:

```text
game-memory.webp
game-which-one.webp
game-whats-missing.webp
```

Recommended generation source:

```text
1024×640
```

No text in image.

## Artwork concepts

### Memory

- two purple cards
- large gold stars
- soft Talki garden environment
- strong purple/gold focal point

### Which One?

- friendly bunny
- large question mark
- garden background
- cheerful expression

### What's Missing?

- apple
- toy/small car
- question mark
- garden background

## Title overlay

Use a bottom contrast gradient:

```css
background: linear-gradient(
  to top,
  rgba(25,18,35,0.60) 0%,
  rgba(25,18,35,0.18) 48%,
  rgba(25,18,35,0) 100%
);
```

Title:

```css
font-size: 14px;
font-weight: 800;
color: #FFFFFF;
text-shadow: 0 1px 3px rgba(0,0,0,0.20);
```

At 430 px: 15–16 px if visually appropriate.

## Functional requirements

Preserve any existing:

- route
- locked state
- completed state
- recommended state

## Validation

Save:

```text
07-games-390.png
```

Compare:

- aspect ratio
- crop
- title contrast
- spacing
- artwork consistency

## Done when

- games open correctly
- titles remain DOM text
- artwork cohesive
- no broken image requests
- responsive behavior works

## CURSOR RUN 8 — PHASE 7

```text
Execute ONLY Phase 7: Games.

Implement the three approved game cards:
- Memory
- Which One?
- What's Missing?

Use reusable GameCard UI.
Keep Hebrew titles as DOM overlays.
Use separate artwork with no embedded text.
Preserve existing game routes and game states.

Follow the plan's exact card ratio, radius, grid gap, title styling and gradient-overlay guidance.

Search existing Talki game artwork first.
If suitable images are missing, add complete generation requests to docs/talki-home-missing-assets.md.

Validate at 375, 390, 430 and 768 px.

Save:
artifacts/talki-home-redesign/07-games-390.png

Perform visual comparison/fix iteration before stopping.
```

---

# PHASE 8 — Bottom Navigation

## Goal

Restyle the existing navigation to match the approved light/floating bottom bar.

## Container baseline

```css
position: sticky; /* or fixed based on current app shell */
bottom: 0;
min-height: 72px;
padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
background: rgba(255,255,255,0.96);
border: 1px solid #F1E7D7;
box-shadow: 0 -8px 26px rgba(73,46,25,0.10);
```

If using a floating pill form:

```css
margin-inline: 10px;
bottom: 8px;
border-radius: 24px;
```

Choose the version that best matches the approved reference and existing shell behavior.

## Items

Expected:

```text
בית
משחקים
הישגים
הגדרות
```

Minimum touch target:

```text
48×48 px
```

## Active Home item

```css
background: #EEE6FF;
color: #6D3BA6;
border-radius: 18px;
```

Active label:

```css
font-size: 12px;
font-weight: 700;
```

Inactive:

```css
color: #9B91A7;
```

Icon size:

```text
22–24 px
```

## Bottom clearance

Home content bottom padding must equal:

```text
rendered nav height + 16–24 px
```

so the final game cards are never hidden.

## Functional requirements

Reuse the existing route/navigation logic.

## Validation

Save:

```text
08-navigation-390.png
```

Test while scrolled to the bottom.

## Done when

- all tabs work
- active route correct
- safe area works
- content not hidden
- no scroll jump
- visual design matches reference

## CURSOR RUN 9 — PHASE 8

```text
Execute ONLY Phase 8: Bottom Navigation.

Restyle the existing Talki navigation to match the approved Home redesign.

Preserve the existing route/navigation logic.

Implement:
- Home active state
- Games
- Achievements
- Settings
- correct icon/label hierarchy
- safe-area support
- sufficient page bottom clearance
- sticky/fixed behavior matching the existing shell

Use the plan's exact spacing, minimum touch targets, colors, radii and elevation guidance.

Validate with the page scrolled to the bottom.

Save:
artifacts/talki-home-redesign/08-navigation-390.png

Stop after navigation is visually and functionally validated.
```

---

# PHASE 9 — Full-Page Visual Integration

## Goal

Review the complete Home screen as one composition.

Do not add new product features here.

## Header checklist

- utility buttons not too large
- brand remains clear
- header does not compete with hero

## Hero checklist

- dominant visual section
- title obvious
- CTA obvious
- mascot does not overlap content
- artwork crop intentional

## Continue checklist

- secondary to Hero
- enough contrast
- not oversized

## Categories checklist

- consistent rows
- no crowded Hebrew
- progress bars subtle
- accent colors cohesive

## Practice checklist

- three cards distinguishable
- readable
- not more visually dominant than Categories

## Games checklist

- artwork rich and consistent
- titles readable
- card ratios consistent

## Bottom nav checklist

- active Home obvious
- nav visually separate
- content not obscured

## Vertical rhythm target

```text
Header → Hero:          8–12 px
Hero → Continue:        16 px
Continue → Categories: 28 px
Categories → Practice:  28 px
Practice → Games:       28 px
Games → nav clearance:  24–32 px + nav height
```

## Density target

Should feel:

```text
playful
premium
airy
organized
easy to scan
```

Should NOT feel:

```text
dense dashboard
flat admin UI
emoji collection
rainbow overload
```

## Color audit

Purple must remain the dominant brand color.

Other colors are accents.

---

# PHASE 10 — Responsive Validation

## 375 px

Check:

- no clipping
- header collision-free
- hero CTA fits
- categories readable
- practice readable
- games usable

## 390 px

Primary visual comparison viewport.

## 430 px

Use extra width for breathing room, not giant controls.

## 768 px

Use a centered max-width container around 720–760 px.

Do not stretch mobile cards to desktop proportions.

## Final screenshots

```text
09-final-375.png
09-final-390.png
09-final-430.png
09-final-768.png
09-final-fullpage.png
```

## CURSOR RUN 10 — PHASES 9 + 10

```text
Execute ONLY Phases 9 and 10.

Do not add new Home features.

Perform a full visual integration pass against:
docs/design/talki-home-approved.png

Review and tune:
- total page width
- vertical rhythm
- section gaps
- header hierarchy
- hero proportions
- mascot scale
- CTA dimensions
- Continue card balance
- category card height/grid gap
- progress bars
- practice readability
- game card ratio
- bottom navigation height
- typography hierarchy
- colors
- shadows
- radii
- RTL alignment

Validate at:
375 px
390 px
430 px
768 px

Capture:
artifacts/talki-home-redesign/09-final-375.png
artifacts/talki-home-redesign/09-final-390.png
artifacts/talki-home-redesign/09-final-430.png
artifacts/talki-home-redesign/09-final-768.png
artifacts/talki-home-redesign/09-final-fullpage.png

Perform repeated screenshot comparison/fix passes until there are no obvious visual mismatches.

Document any intentional remaining differences.
```

---

# PHASE 11 — Functional Regression

## Header

Verify:

- points use real state
- reward action works
- music toggle works
- speech/speed control works
- settings persist where they did before

## Hero

Verify CTA resumes/starts the correct learning flow.

## Continue

Test:

- no history
- partial progress
- completed category
- last-category routing

## Categories

Open every category and verify:

- correct category
- total words
- real progress
- correct route

## Practice

Launch all three modes.

## Games

Launch all games.

## Navigation

Verify:

- Home
- Games
- Achievements
- Settings
- browser back
- browser forward
- refresh
- direct route entry where supported

---

# PHASE 12 — Automated Quality

Use repository-native scripts only.

Typical examples:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Do not invent scripts that are not present.

## Browser/console checks

Verify no:

- uncaught errors
- React warnings
- 404 assets
- hydration errors
- routing errors
- broken image requests

## Accessibility

Verify:

- icon buttons have accessible names
- cards are keyboard accessible when interactive
- focus styles visible
- decorative images use empty alt
- semantic images use meaningful alt
- contrast acceptable
- no nested interactive controls

---

# PHASE 13 — Asset Cleanup

Recommended organization, adapted to existing repo:

```text
public/assets/talki/
  brand/
  mascot/
  hero/
  categories/
  practice/
  games/
  ui/
```

Good names:

```text
talki-mascot-wave.png
talki-home-hero-landscape.webp
category-animals.png
game-memory.webp
```

Bad names:

```text
image1.png
new2.png
final-final.png
generated_8491.png
```

Remove only assets proven unused.

Never delete a legacy asset still used by another screen.

---

# PHASE 14 — Final Report

Create:

```text
docs/talki-home-redesign-report.md
```

Required format:

```md
# Talki Home Redesign Report

## Components created
...

## Components modified
...

## Existing logic reused
...

## Assets reused
...

## New assets
...

## Remaining missing assets
...

## Visual validation
375: PASS/FAIL
390: PASS/FAIL
430: PASS/FAIL
768: PASS/FAIL

## Functional validation
Header: PASS/FAIL
Hero CTA: PASS/FAIL
Continue: PASS/FAIL
Categories: PASS/FAIL
Practice: PASS/FAIL
Games: PASS/FAIL
Navigation: PASS/FAIL

## Quality
Lint: PASS/FAIL
Typecheck: PASS/FAIL
Tests: PASS/FAIL
Build: PASS/FAIL
E2E: PASS/FAIL
Console: PASS/FAIL
Accessibility: PASS/FAIL

## Known design differences
...

## Remaining risks
...
```

Do not claim pixel-perfect completion while known mismatches remain.

## CURSOR RUN 11 — PHASES 11–14

```text
Execute ONLY Phases 11 through 14.

Run full regression and quality validation for the redesigned Talki Home screen.

Verify:
- header actions
- points
- hero CTA
- Continue Learning
- every category
- all practice modes
- all games
- bottom navigation
- browser back/forward
- refresh behavior
- RTL
- accessibility
- console errors
- missing assets

Run the repository's real lint, typecheck, tests, production build and relevant Playwright/e2e scripts.

Clean up temporary/duplicate assets without deleting anything used elsewhere.

Create:
docs/talki-home-redesign-report.md

The report must include:
- changed components
- reused functionality
- reused/new assets
- remaining missing assets
- viewport validation
- functional validation
- quality results
- known differences
- remaining risks

Do not declare completion while any High-priority missing asset, broken route, visual regression, console error, failed build, or failed essential test remains.
```

---

# 15. ChatGPT Asset Generation Workflow

Whenever Cursor finds missing artwork:

1. Add the exact request to `docs/talki-home-missing-assets.md`.
2. Stop only if the missing asset blocks accurate implementation.
3. Generate **one asset per file** in ChatGPT.
4. Preserve requested dimensions and transparency.
5. Put it in the exact repo path.
6. Resume the current Cursor phase.
7. Re-run Playwright screenshot validation after integration.

Never generate a sprite sheet unless explicitly required.

---

# 16. Definition of Done

- [ ] Approved redesign is clearly reproduced.
- [ ] Home is responsive.
- [ ] 375 px works.
- [ ] 390 px closely matches the reference.
- [ ] 430 px works.
- [ ] 768 px works.
- [ ] RTL is correct.
- [ ] Hebrew is real DOM text.
- [ ] No text is baked into artwork.
- [ ] No production emoji placeholders remain.
- [ ] Points use real state.
- [ ] Continue Learning uses real state.
- [ ] Progress values are real.
- [ ] Categories use real config.
- [ ] Category navigation works.
- [ ] Practice modes work.
- [ ] Games work.
- [ ] Header controls work.
- [ ] Bottom navigation works.
- [ ] No content is hidden by navigation.
- [ ] No High-priority assets remain missing.
- [ ] No 404 asset requests.
- [ ] No uncaught browser errors.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Relevant tests pass.
- [ ] Playwright screenshots are captured.
- [ ] Final report is created.

---

# 17. Master Rule for Cursor

Never move to the next visual phase merely because the code compiles.

For every phase:

```text
READ THE PLAN
     ↓
INSPECT EXISTING CODE
     ↓
REUSE REAL LOGIC
     ↓
IMPLEMENT THE VISUAL DESIGN
     ↓
RUN APP
     ↓
CAPTURE PLAYWRIGHT SCREENSHOT
     ↓
COMPARE AGAINST APPROVED MOCKUP
     ↓
FIX DIFFERENCES
     ↓
REPEAT SCREENSHOT
     ↓
VERIFY INTERACTION
     ↓
ONLY THEN STOP THE PHASE
```

The goal is **not** to create a Home screen that is merely inspired by the design.

The goal is to accurately implement the approved Talki Home design as production-quality responsive UI while preserving Talki's real functionality.
