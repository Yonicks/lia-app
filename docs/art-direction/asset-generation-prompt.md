# Talki asset generation prompt

Reusable prompt + visual source of truth for generating illustrated word assets
that match the Talki design style.

## How to use

1. Attach **[`talki-design-reference.png`](./talki-design-reference.png)** as the
   style reference image. This is the single source of truth for look and feel.
2. Copy the prompt below into the image generator.
3. Replace `[CATEGORY NAME]` and `[PASTE THE EXACT ITEM LIST HERE]`.
4. Generate a **master category sheet** first, then individual
   `1024 × 1024` transparent PNGs once the sheet looks consistent.

---

# PROMPT (copy from here)

Create the complete asset set for the **Talki – משחקים שמפתחים את הדיבור** children’s speech-learning app.

## Category

**[CATEGORY NAME]**

## Items to create

[PASTE THE EXACT ITEM LIST HERE]

## IMPORTANT ART DIRECTION

Use the attached Talki design reference as the **single source of truth for visual style**.

The assets must feel like they belong naturally inside the existing Talki screens.

The visual direction is:

* premium illustrated children's storybook
* warm, soft and inviting
* polished digital illustration
* subtle hand-painted texture
* soft natural lighting
* gentle depth and dimensionality
* slightly rounded, child-friendly proportions
* realistic enough for a 2–4 year old to immediately recognize the object
* simplified enough to remain clear at small mobile sizes
* expressive and charming, but **not exaggerated cartoon characters**
* cohesive color palette
* visually consistent across the entire category
* suitable for a high-quality commercial preschool app

### VERY IMPORTANT — DO NOT make it look like generic AI art

Avoid:

* glossy Pixar-like 3D rendering
* oversized anime/cartoon eyes
* excessive smiling faces on objects
* plastic-looking surfaces
* random gradients behind objects
* neon colors
* exaggerated saturation
* sticker outlines
* thick white borders
* emoji styling
* clip-art styling
* inconsistent illustration styles
* different lighting between assets
* unnecessary decorations
* busy backgrounds
* text baked into the artwork

The result should look like **one professional children's illustrator created the entire asset library for one app**.

---

# ASSET RULES

Create **one separate asset for every item** in the list.

Every asset must have:

* transparent background
* no card
* no frame
* no border
* no label
* no Hebrew text
* no English text
* no UI elements
* no scenery unless absolutely necessary to understand the object
* object fully visible with nothing cropped
* centered composition
* consistent perspective
* consistent visual scale relative to other objects
* consistent lighting direction
* subtle natural contact shadow only where appropriate

Objects should fill approximately **75–85% of the available canvas**.

Keep enough transparent padding around each item so the app can safely place it inside:

* category tiles
* flashcards
* quizzes
* memory cards
* matching games
* sorting games
* speech exercises

---

# VISUAL CONSISTENCY

All assets in this category must clearly belong to the **same Talki illustration family**.

For example:

* animals should have comparable body proportions and rendering
* foods should use the same softness, texture and lighting
* toys should feel like objects from the same illustrated world
* furniture should use the same warm materials and perspective
* clothing should use consistent folds and fabric treatment

Do not independently reinterpret the art style for each item.

---

# CHILD RECOGNITION

These assets are primarily for toddlers learning words and speech.

Prioritize instant recognition.

For every object:

* show the most canonical version of the object
* avoid unusual variants
* avoid unnecessary details
* avoid confusing angles
* preserve distinctive features
* use clear silhouettes
* make visually similar objects easy to distinguish

Example:

A chair should immediately look like a normal chair.

A dog should immediately read as “dog”, not a specific unusual breed.

An apple should be a clear classic red apple.

---

# COLOR AND LIGHT

Match the Talki reference:

* warm cream-friendly palette
* natural greens
* warm browns
* gentle reds
* muted blues
* soft golden accents
* subtle watercolor/storybook texture
* soft daylight
* gentle shadows

Do not place colored backgrounds behind individual assets.

The final PNG background must remain **fully transparent**.

---

# OUTPUT

First generate a **master category sheet** containing every asset so I can validate visual consistency.

Then create each approved item as an individual high-resolution PNG:

`[category]-[item-name].png`

Recommended individual asset size:

**1024 × 1024 PNG with transparent background**

Keep the character/object position and scale consistent between files.

Do not redesign the Talki UI.

Do not add screens.

Do not add labels.

This task is only about producing the **final reusable visual asset library** for the existing Talki application.
