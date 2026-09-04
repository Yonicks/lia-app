# Talki Landscape Screen Map

This file maps the current application surfaces to the landscape redesign program.

It is an inventory, not permission to change behavior.

## Main child hubs

| Surface | Current implementation | Landscape target |
|---|---|---|
| Home | `src/features/home/HomeScreen.tsx` | World home hub, hero/progress, category strip |
| Games | `src/features/games/GamesMenuScreen.tsx` | 3×2 paged game hub |
| Practice | `src/features/practice/PracticeMenuScreen.tsx` | 3×2 practice hub |
| Rewards | `src/features/rewards/*` | Landscape rewards/stickers |
| Category | `src/features/categories/CategoryScreen.tsx` | Landscape vocabulary learning surface |

## Games

All registered games must remain reachable:

1. Quiz
2. Memory
3. Missing
4. Match
5. Cards
6. Sounds
7. Count
8. Sort
9. Bubbles
10. Puzzle
11. Speech

Current registry:

`src/features/games/shell/gameRegistry.ts`

The games reference shows only six cards. This is a visual page, not the complete product catalog.

## Practice modes

All six remain:

1. Focus
2. Receptive
3. Cloze
4. Temptation
5. Pairs
6. Combine

Current registry:

`src/features/practice/practiceRegistry.ts`

The practice reference maps naturally to a single 3×2 page.

## Vocabulary/categories

The current domain has the built-in vocabulary categories plus the synthetic custom/my-words category.

Current sources include:

- `src/domain/vocabulary/categories.ts`
- `src/domain/vocabulary/allCats.ts`
- `src/features/home/CategoryGrid.tsx`
- `src/features/categories/CategoryScreen.tsx`

The Home reference displays fewer categories than the complete domain. The final landscape Home must preserve all category reachability.

## Parent surfaces

All must remain usable in landscape:

- Parent gate
- Parent center
- Method tab
- Record tab
- Report tab
- Settings tab
- Words/custom words tab
- Photo picker
- Recording controls
- Backup/restore controls

Current implementation:

`src/features/parent/` — `ParentScreen.tsx` plus 5 tabs under
`src/features/parent/tabs/`: `MethodTab`, `RecordTab`, `ReportTab`,
`SettingsTab`, `WordsTab` (verified during Phase 16 audit,
`docs/migration/phase-16-audit.md` §5–6).

## Global surfaces

- Native splash
- Yonicks Studios bumper
- Talki intro
- Toast host
- Reward/celebration overlays
- Game done state
- Loading states
- Not-found/fallback
- Ad banner policy
- Deep-link entry
- Hardware back behavior

## Migration waves

The planned migration waves are defined in:

`docs/migration/landscape-roadmap.md`

No surface is considered deleted because it is not shown in the three reference mocks.
