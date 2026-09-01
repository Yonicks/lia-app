/**
 * Real Talki art used by the design system's shell components and gallery —
 * "Use real Talki art from assets/v2/. No emoji placeholders."
 * (phase-05-plan.md work item 5). Copied from the repository-root
 * `assets/v2/` (the legacy app's own asset folder, untouched) into
 * `apps/mobile/assets/v2/` so Metro can bundle them; the legacy copies are
 * the source of truth and are never edited.
 */
export const navIcons = {
  home: require('../../assets/v2/nav/talki-nav-home.png'),
  games: require('../../assets/v2/nav/talki-nav-games.png'),
  stickers: require('../../assets/v2/nav/talki-nav-rewards.png'),
} as const;

export const uiIcons = {
  back: require('../../assets/v2/icons/talki-ui-icon-back.png'),
  close: require('../../assets/v2/icons/talki-ui-icon-close.png'),
  music: require('../../assets/v2/icons/talki-ui-icon-music.png'),
  speaker: require('../../assets/v2/icons/talki-ui-icon-speaker.png'),
  star: require('../../assets/v2/icons/talki-ui-icon-star.png'),
  gift: require('../../assets/v2/icons/talki-ui-icon-gift.png'),
  chevron: require('../../assets/v2/icons/talki-chevron-left.png'),
  settings: require('../../assets/v2/icons/talki-ui-icon-settings.png'),
} as const;

export const brand = {
  headerLogo: require('../../assets/v2/brand/talki-header-logo.png'),
} as const;

/** Ten built-in categories' icon art (index.html `.cat-card .hero-chip img`
 *  equivalent). `mine` (custom words) has no dedicated icon in legacy either
 *  — it reuses the emoji 💜, which is out of scope for this art registry. */
/** Opening-sequence art (Phase 6) — the same files `sw.js` 18-25 precaches
 *  and comments "opening bumper art — the intro must survive an offline
 *  launch". Copied from the repository-root `assets/v2/` exactly like every
 *  other art registry entry in this file. */
export const introAssets = {
  background: require('../../assets/v2/backgrounds/talki-bg-home-hero.png'),
  star: require('../../assets/v2/mascot/talki-star-waving.png'),
  sparkleYellow: require('../../assets/v2/effects/talki-particle-star-yellow.png'),
  sparklePurple: require('../../assets/v2/effects/talki-particle-star-purple.png'),
  sparkleGreen: require('../../assets/v2/effects/talki-particle-star-green.png'),
  sparkleSmall: require('../../assets/v2/effects/talki-particle-star-small.png'),
  wordmark: require('../../assets/v2/brand/talki-logo-mark.png'),
} as const;

export const categoryIcons = {
  animals: require('../../assets/v2/categories/talki-cat-icon-animals.png'),
  food: require('../../assets/v2/categories/talki-cat-icon-food.png'),
  colors: require('../../assets/v2/categories/talki-cat-icon-colors.png'),
  home: require('../../assets/v2/categories/talki-cat-icon-home.png'),
  family: require('../../assets/v2/categories/talki-cat-icon-family.png'),
  body: require('../../assets/v2/categories/talki-cat-icon-body.png'),
  actions: require('../../assets/v2/categories/talki-cat-icon-actions.png'),
  numbers: require('../../assets/v2/categories/talki-cat-icon-numbers.png'),
  outside: require('../../assets/v2/categories/talki-cat-icon-outside.png'),
  emotions: require('../../assets/v2/categories/talki-cat-icon-emotions.png'),
} as const;
