#!/usr/bin/env node
/**
 * Scans assets/words/, assets/v2/ and assets/audio/ at the repo root and
 * emits three typed registry modules under apps/mobile/src/data/assets/,
 * each a plain object of STATIC `require()` calls keyed by a stable string.
 *
 * Why generated rather than hand-written: React Native's bundler (Metro)
 * statically analyses `require()` calls at build time and cannot resolve a
 * dynamic path — `require(someVariable)` — so every asset needs its own
 * literal `require('...')` call. There are 182 word images, ~155 v2 UI
 * assets and 35 audio files; hand-writing that list invites drift the
 * moment an asset is added, renamed or removed, and is exactly the kind of
 * mechanical, high-volume transcription that should never be done by hand
 * (see the standing rule "No hand-maintained require() list. Generate it.").
 *
 * Determinism: every scan is sorted by key before rendering, and the
 * renderer's output depends on nothing but the sorted entry list — no
 * timestamps, no directory-iteration-order dependence (Node's readdirSync
 * order is not guaranteed stable across platforms, so results are always
 * explicitly re-sorted here before use). Running this script twice produces
 * byte-identical files; apps/mobile/tests/unit/asset-registry.test.ts
 * verifies this by running it as a subprocess twice and diffing the output.
 *
 * This module is both a CLI entry point (`node tools/generate-mobile-asset-registry.mjs`)
 * and an importable set of pure functions, so the Tier 1 test can exercise
 * the exact same scan/render logic without spawning a process for every
 * assertion, and without ever calling Node's own `require()` on a binary
 * .png/.mp3 file (which has no CommonJS loader and would throw).
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, '..');
export const WORDS_DIR = resolve(REPO_ROOT, 'assets/words');
export const V2_DIR = resolve(REPO_ROOT, 'assets/v2');
export const AUDIO_DIR = resolve(REPO_ROOT, 'assets/audio');

export const OUT_DIR = resolve(REPO_ROOT, 'apps/mobile/src/data/assets');
export const WORDS_OUT = resolve(OUT_DIR, 'words.generated.ts');
export const V2_OUT = resolve(OUT_DIR, 'v2.generated.ts');
export const AUDIO_OUT = resolve(OUT_DIR, 'audio.generated.ts');

const CATEGORY_DIRS = [
  'actions',
  'animals',
  'body',
  'colors',
  'emotions',
  'family',
  'food',
  'home',
  'numbers',
  'outside',
];

/**
 * A word image matches `talki-{cat}-{slug}.png`, or
 * `talki-colors-shapes-{slug}.png` for the colours category (art(), index.html
 * 1476-1479). Everything else in assets/words/ — the ten `.gitkeep` files and
 * category covers such as `assets/words/food/food.png` — is excluded simply
 * by not matching this pattern; there is no separate exclusion list to
 * maintain.
 */
function wordFilePattern(cat) {
  return cat === 'colors' ? /^talki-colors-shapes-[a-z0-9-]+\.png$/ : new RegExp(`^talki-${cat}-[a-z0-9-]+\\.png$`);
}

/** { key: 'assets/words/{cat}/{file}', absPath }, sorted by key. */
export function scanWordAssets() {
  const entries = [];
  for (const cat of CATEGORY_DIRS) {
    const dir = resolve(WORDS_DIR, cat);
    if (!existsSync(dir)) continue;
    const pattern = wordFilePattern(cat);
    for (const file of readdirSync(dir)) {
      if (!pattern.test(file)) continue;
      entries.push({
        key: `assets/words/${cat}/${file}`,
        absPath: resolve(dir, file),
      });
    }
  }
  entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return entries;
}

/** { key: 'assets/v2/{subpath}', absPath }, sorted by key. Every .png/.webp
 *  file anywhere under assets/v2/ is a real UI asset — no exclusions. */
export function scanV2Assets() {
  const entries = [];
  const IMAGE_EXT = /\.(png|webp)$/i;
  function walk(dir, relParts) {
    for (const name of readdirSync(dir)) {
      const abs = resolve(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) {
        walk(abs, [...relParts, name]);
      } else if (IMAGE_EXT.test(name)) {
        entries.push({
          key: posix.join('assets/v2', ...relParts, name),
          absPath: abs,
        });
      }
    }
  }
  if (existsSync(V2_DIR)) walk(V2_DIR, []);
  entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return entries;
}

/**
 * { key: 'music/{file}' | 'sfx/{file}', absPath }, sorted by key. The key
 * intentionally has no `assets/audio/` prefix — it matches the value format
 * audioPolicy.ts's MUSIC_FILES/SFX_FILES already use (e.g.
 * 'music/01_main_menu_welcome.mp3'), so a later phase's audio manager can
 * look up `resolveMusicFile(state)` or `SFX_FILES[event]` directly in this
 * registry without reformatting the string. audio-logic.js itself (the
 * pure-logic module, not an asset) is excluded.
 */
export function scanAudioAssets() {
  const entries = [];
  for (const sub of ['music', 'sfx']) {
    const dir = resolve(AUDIO_DIR, sub);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.mp3')) continue;
      entries.push({ key: `${sub}/${file}`, absPath: resolve(dir, file) });
    }
  }
  entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return entries;
}

/**
 * Renders a sorted entry list as a TypeScript module of static `require()`
 * calls. `outFilePath` is used only to compute each `require()` path
 * relative to the generated file's own location (POSIX-separated, always
 * `./` or `../`-prefixed, matching Metro's expectations).
 */
export function renderRegistryModule({ entries, outFilePath, varName, header }) {
  const lines = [];
  lines.push(header.trimEnd());
  lines.push('');
  lines.push(`export const ${varName}: Record<string, number> = {`);
  for (const { key, absPath } of entries) {
    let rel = relative(dirname(outFilePath), absPath).split('\\').join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    lines.push(`  ${JSON.stringify(key)}: require(${JSON.stringify(rel)}),`);
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

const WORDS_HEADER = `/**
 * GENERATED by tools/generate-mobile-asset-registry.mjs. Do not hand-edit —
 * re-run the generator instead (it is deterministic; two runs are
 * byte-identical). Keys are the legacy \`img\` path exactly as produced by
 * art(cat, slug) (index.html 1476-1479), so a TalkiWord.img value looks this
 * registry up directly. Colours entries use the \`talki-colors-shapes-\` form;
 * .gitkeep files and category covers (e.g. assets/words/food/food.png) are
 * excluded because they never match the word-image filename pattern.
 */`;

const V2_HEADER = `/**
 * GENERATED by tools/generate-mobile-asset-registry.mjs. Do not hand-edit —
 * re-run the generator instead (it is deterministic; two runs are
 * byte-identical). Keys are \`assets/v2/...\` paths mirroring the on-disk
 * layout under assets/v2/ (backgrounds, badges, icons, stickers, etc).
 */`;

const AUDIO_HEADER = `/**
 * GENERATED by tools/generate-mobile-asset-registry.mjs. Do not hand-edit —
 * re-run the generator instead (it is deterministic; two runs are
 * byte-identical). Keys deliberately match audioPolicy.ts's
 * MUSIC_FILES/SFX_FILES value format ('music/...', 'sfx/...'), not a full
 * assets/audio/ path, so resolveMusicFile()/SFX_FILES lookups key into this
 * registry unchanged. assets/audio/audio-logic.js (pure logic, not an
 * asset) is excluded.
 */`;

export function generateAll() {
  mkdirSync(OUT_DIR, { recursive: true });

  const words = scanWordAssets();
  writeFileSync(
    WORDS_OUT,
    renderRegistryModule({
      entries: words,
      outFilePath: WORDS_OUT,
      varName: 'WORDS_ASSETS',
      header: WORDS_HEADER,
    }),
    'utf8',
  );

  const v2 = scanV2Assets();
  writeFileSync(
    V2_OUT,
    renderRegistryModule({
      entries: v2,
      outFilePath: V2_OUT,
      varName: 'V2_ASSETS',
      header: V2_HEADER,
    }),
    'utf8',
  );

  const audio = scanAudioAssets();
  writeFileSync(
    AUDIO_OUT,
    renderRegistryModule({
      entries: audio,
      outFilePath: AUDIO_OUT,
      varName: 'AUDIO_ASSETS',
      header: AUDIO_HEADER,
    }),
    'utf8',
  );

  return { words, v2, audio };
}

// CLI entry point
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { words, v2, audio } = generateAll();
  // eslint-disable-next-line no-console
  console.log(`words.generated.ts: ${words.length} entries`);
  console.log(`v2.generated.ts:    ${v2.length} entries`);
  console.log(`audio.generated.ts: ${audio.length} entries`);
}
