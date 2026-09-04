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
| `reference/talki-landscape-master.jpg` | REFERENCE | Original composite landscape mock |
| `reference/home.jpg` | REFERENCE | Home crop |
| `reference/games.jpg` | REFERENCE | Games hub crop |
| `reference/practice.jpg` | REFERENCE | Practice hub crop |

## Production asset families

### World backgrounds

| Asset family | Status | Notes |
|---|---|---|
| Home world background | NEEDED | High-resolution, no UI baked in |
| Games world background | NEEDED | Same storybook world, distinct place/scene |
| Practice world background | NEEDED | Same storybook world, distinct place/scene |
| Tablet-compatible crops/source | NEEDED | Prefer high-res master/focal crop strategy |

### Shared brand/chrome

| Asset family | Status | Notes |
|---|---|---|
| Talki logo | EXISTING / VERIFY | Verify current high-quality asset fits landscape |
| Yellow Talki mascot | EXISTING / VERIFY | Verify correct transparent high-res version |
| Music control art | EXISTING / VERIFY | Reuse if visually compatible |
| Parent/profile control art | EXISTING / VERIFY | Reuse if visually compatible |
| Star/reward art | EXISTING / VERIFY | Reuse if visually compatible |
| Side navigation arrows | NEEDED / CAN-BE-UI | Prefer real vector/UI primitive if matching mock |

### Home categories

The final category count comes from the current domain, not from the reference image.

Required:

- one production art asset per visible category;
- transparent/high-quality source where card composition requires separation;
- no baked Hebrew text inside the art.

Status: `VERIFY` current assets, then mark missing assets explicitly during Phase 16 audit.

### Games

The current app registers 11 games.

Required:

- one high-quality card illustration per game;
- no title text baked into the illustration;
- consistent storybook style;
- safe crop area for phone/tablet card ratios.

Status: `VERIFY` current generated/assets registry during Phase 16 audit.

### Practice

Six practice modes require six card illustrations matching the reference visual language.

Status: `VERIFY` current assets, mark gaps during Phase 16 audit.

## Asset implementation rules

- Do not use the reference screenshot as a card/background production asset.
- Do not bake interactive labels into raster art.
- Do not stretch source art.
- Record source dimensions and focal crop notes once production assets are approved.
- Prefer explicit asset registry entries over ad-hoc `require()` calls scattered across screens.
- Missing required art must remain visible in reports as a design dependency.
