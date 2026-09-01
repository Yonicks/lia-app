/**
 * Tests tools/generate-mobile-asset-registry.mjs: determinism, and
 * completeness in both directions against the ported CATEGORIES. Deliberately
 * never calls Node's own require() on a generated .png/.mp3 module — there is
 * no CommonJS loader for those extensions outside a bundler (Metro), so this
 * suite instead (a) runs the generator as a real subprocess twice and diffs
 * the emitted files byte-for-byte, and (b) exercises the generator's own
 * scan functions directly, which return plain {key, absPath} data with no
 * require() involved.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@/domain/vocabulary/categories';

const REPO_ROOT = resolve(__dirname, '../../../..');
const GENERATOR = resolve(REPO_ROOT, 'tools/generate-mobile-asset-registry.mjs');
const WORDS_OUT = resolve(REPO_ROOT, 'apps/mobile/src/data/assets/words.generated.ts');
const V2_OUT = resolve(REPO_ROOT, 'apps/mobile/src/data/assets/v2.generated.ts');
const AUDIO_OUT = resolve(REPO_ROOT, 'apps/mobile/src/data/assets/audio.generated.ts');

// The generator is a real .mjs file (a CLI entry point as well as an
// importable module), loaded here with a file:// dynamic import rather than
// require() so it runs as genuine ESM.
const generator = await import(/* @vite-ignore */ `file://${GENERATOR}`);

function allLegacyImgPaths(): string[] {
  return Object.values(CATEGORIES).flatMap((c) => c.items.map((i) => i.img as string));
}

interface RegistryEntry {
  key: string;
  absPath: string;
}

describe('generator determinism', () => {
  it('running the CLI twice produces byte-identical registry files', () => {
    execFileSync('node', [GENERATOR], { cwd: REPO_ROOT });
    const first = {
      words: readFileSync(WORDS_OUT, 'utf8'),
      v2: readFileSync(V2_OUT, 'utf8'),
      audio: readFileSync(AUDIO_OUT, 'utf8'),
    };
    execFileSync('node', [GENERATOR], { cwd: REPO_ROOT });
    const second = {
      words: readFileSync(WORDS_OUT, 'utf8'),
      v2: readFileSync(V2_OUT, 'utf8'),
      audio: readFileSync(AUDIO_OUT, 'utf8'),
    };
    expect(second.words).toBe(first.words);
    expect(second.v2).toBe(first.v2);
    expect(second.audio).toBe(first.audio);
  });

  it('the in-process scan functions are also deterministic across two calls', () => {
    const run1 = generator.scanWordAssets();
    const run2 = generator.scanWordAssets();
    expect(run2).toEqual(run1);
  });

  it('rendered TS source is byte-identical across two renders of the same entries', () => {
    const entries = generator.scanWordAssets();
    const a = generator.renderRegistryModule({
      entries,
      outFilePath: WORDS_OUT,
      varName: 'WORDS_ASSETS',
      header: '/** test */',
    });
    const b = generator.renderRegistryModule({
      entries,
      outFilePath: WORDS_OUT,
      varName: 'WORDS_ASSETS',
      header: '/** test */',
    });
    expect(b).toBe(a);
  });
});

describe('word asset registry completeness', () => {
  const words = generator.scanWordAssets() as RegistryEntry[];
  const registryKeys = new Set(words.map((w) => w.key));

  it('every one of the 182 img paths produced by the ported CATEGORIES has a registry entry', () => {
    const legacyPaths = allLegacyImgPaths();
    expect(legacyPaths).toHaveLength(182);
    for (const p of legacyPaths) {
      expect(registryKeys.has(p)).toBe(true);
    }
  });

  it('every registry entry resolves to a file that exists on disk', () => {
    expect(words.length).toBeGreaterThan(0);
    for (const { absPath } of words) {
      expect(existsSync(absPath)).toBe(true);
    }
  });

  it('has exactly 182 entries (no orphans beyond the 182 legacy words)', () => {
    expect(words).toHaveLength(182);
  });

  it('contains no .gitkeep entries', () => {
    for (const { key } of words) {
      expect(key.endsWith('.gitkeep')).toBe(false);
    }
  });

  it('contains no category cover such as assets/words/food/food.png', () => {
    expect(registryKeys.has('assets/words/food/food.png')).toBe(false);
    for (const { key } of words) {
      // every key must match either the plain or the colours word-image form
      const isPlain = /^assets\/words\/[a-z]+\/talki-[a-z]+-[a-z0-9-]+\.png$/.test(key);
      const isColours = /^assets\/words\/colors\/talki-colors-shapes-[a-z0-9-]+\.png$/.test(key);
      expect(isPlain || isColours).toBe(true);
    }
  });

  it('colours entries use the talki-colors-shapes- form', () => {
    const coloursEntries = words.filter((w) => w.key.startsWith('assets/words/colors/'));
    expect(coloursEntries).toHaveLength(26);
    for (const { key } of coloursEntries) {
      expect(key).toMatch(/^assets\/words\/colors\/talki-colors-shapes-[a-z0-9-]+\.png$/);
    }
  });
});

describe('v2 and audio registries', () => {
  it('v2 registry has entries and every one resolves on disk', () => {
    const v2 = generator.scanV2Assets();
    expect(v2.length).toBeGreaterThan(0);
    for (const { absPath } of v2) expect(existsSync(absPath)).toBe(true);
  });

  it('audio registry excludes audio-logic.js and every entry resolves on disk', () => {
    const audio = generator.scanAudioAssets();
    expect(audio.length).toBeGreaterThan(0);
    for (const { key: k, absPath } of audio) {
      expect(k.endsWith('.js')).toBe(false);
      expect(existsSync(absPath)).toBe(true);
    }
  });
});
