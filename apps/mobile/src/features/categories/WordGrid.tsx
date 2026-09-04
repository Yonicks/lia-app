/**
 * WordGrid — legacy portrait wrap grid removed in Phase 23.
 *
 * The landscape CategoryScreen composes `LandscapeWordGrid` + `WordTile`
 * directly with token-driven paging. This module remains as a thin
 * re-export seam so older imports/tests that reference WordGrid keep a
 * stable path; prefer LandscapeWordGrid for new call sites.
 */
export { LandscapeWordGrid as WordGrid } from '@/design-system/landscape';
export type { LandscapeWordGridProps as WordGridProps } from '@/design-system/landscape/LandscapeWordGrid';
