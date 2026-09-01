/**
 * Differential test: the ported domain deep-equals
 * docs/migration/fixtures/legacy-domain.json, which tools/extract-legacy-domain.mjs
 * produces directly from index.html. This is the test that catches a single
 * transposed or dropped niqqud mark in one of 182 Hebrew words — a
 * hand-written `expect(...).toBe('...')` would only test what the author
 * believes index.html contains, and the whole risk of this migration is
 * that the belief is wrong.
 *
 * To regenerate the fixture: `node tools/extract-legacy-domain.mjs` from the
 * repo root.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@/domain/vocabulary/categories';
import { GAMES } from '@/domain/games/ids';
import { MIN_ITEMS } from '@/domain/games/minItems';
import { HOME_PRACTICE_HOME, PRACTICE_LIST } from '@/domain/practice/list';
import { CARRIERS, CLOZE, MODIFIERS, PAIRS } from '@/domain/practice/content';
import { STICKERS } from '@/domain/rewards/stickers';
import { DEFAULT_SETTINGS } from '@/domain/settings/defaults';

const FIXTURE_PATH = resolve(__dirname, '../../../../docs/migration/fixtures/legacy-domain.json');
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));

describe('domain parity vs. extracted legacy-domain.json', () => {
  it('CATEGORIES deep-equals the fixture', () => {
    expect(CATEGORIES).toEqual(fixture.CATEGORIES);
  });

  it('has exactly 10 categories', () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(10);
  });

  it('has exactly 182 words total, with the documented per-category split', () => {
    const expectedCounts: Record<string, number> = {
      animals: 26,
      food: 26,
      colors: 26,
      home: 26,
      outside: 18,
      actions: 16,
      family: 12,
      body: 12,
      numbers: 10,
      emotions: 10,
    };
    let total = 0;
    for (const [id, count] of Object.entries(expectedCounts)) {
      expect(CATEGORIES[id as keyof typeof CATEGORIES].items).toHaveLength(count);
      total += count;
    }
    expect(total).toBe(182);

    const actualTotal = Object.values(CATEGORIES).reduce((s, c) => s + c.items.length, 0);
    expect(actualTotal).toBe(182);
  });

  it('every word string is byte-identical to the fixture, niqqud preserved', () => {
    for (const catId of Object.keys(fixture.CATEGORIES)) {
      const expectedWords = fixture.CATEGORIES[catId].items.map((i: { word: string }) => i.word);
      const actualWords = CATEGORIES[catId as keyof typeof CATEGORIES].items.map((i) => i.word);
      expect(actualWords).toEqual(expectedWords);
    }
  });

  it('preserves the escaped apostrophe in גִּ\'ירָפָה intact', () => {
    const giraffe = CATEGORIES.animals.items.find((i) => i.emoji === '🦒');
    expect(giraffe?.word).toBe('גִּ\'ירָפָה');
    // Exactly one literal apostrophe character, not a backslash-apostrophe pair.
    expect(giraffe?.word).toContain("'");
    expect(giraffe?.word).not.toContain('\\');
  });

  it('exactly 17 items carry a sound field', () => {
    const withSound = Object.values(CATEGORIES).flatMap((c) => c.items.filter((i) => i.sound));
    expect(withSound).toHaveLength(17);
    const expectedWithSound = Object.values(fixture.CATEGORIES).flatMap((c: any) =>
      c.items.filter((i: { sound?: string }) => i.sound),
    );
    expect(expectedWithSound).toHaveLength(17);
  });

  it("preserves art()'s colours branch — colours img paths use talki-colors-shapes-", () => {
    for (const item of CATEGORIES.colors.items) {
      expect(item.img).toMatch(/^assets\/words\/colors\/talki-colors-shapes-[a-z0-9-]+\.png$/);
    }
  });

  it('every img path matches the fixture exactly', () => {
    for (const catId of Object.keys(fixture.CATEGORIES)) {
      const expectedImgs = fixture.CATEGORIES[catId].items.map((i: { img: string }) => i.img);
      const actualImgs = CATEGORIES[catId as keyof typeof CATEGORIES].items.map((i) => i.img);
      expect(actualImgs).toEqual(expectedImgs);
    }
  });

  it('PRACTICE_LIST deep-equals the fixture', () => {
    expect(PRACTICE_LIST).toEqual(fixture.PRACTICE_LIST);
  });

  it('HOME_PRACTICE_HOME deep-equals the fixture', () => {
    expect(HOME_PRACTICE_HOME).toEqual(fixture.HOME_PRACTICE_HOME);
  });

  it('MIN_ITEMS has 16 entries and deep-equals the fixture', () => {
    expect(Object.keys(MIN_ITEMS)).toHaveLength(16);
    expect(MIN_ITEMS).toEqual(fixture.MIN_ITEMS);
  });

  it('STICKERS has 24 entries and deep-equals the fixture', () => {
    expect(STICKERS).toHaveLength(24);
    expect(STICKERS).toEqual(fixture.STICKERS);
  });

  it('CARRIERS deep-equals the fixture', () => {
    expect(CARRIERS).toEqual(fixture.CARRIERS);
  });

  it('CLOZE deep-equals the fixture', () => {
    expect(CLOZE).toEqual(fixture.CLOZE);
  });

  it('PAIRS deep-equals the fixture', () => {
    expect(PAIRS).toEqual(fixture.PAIRS);
  });

  it('MODIFIERS deep-equals the fixture', () => {
    expect(MODIFIERS).toEqual(fixture.MODIFIERS);
  });

  it('settings defaults deep-equal the fixture', () => {
    expect(DEFAULT_SETTINGS).toEqual(fixture.SETTINGS_DEFAULTS);
  });

  it('the game id/title list deep-equals the fixture (11 entries)', () => {
    expect(GAMES).toHaveLength(11);
    expect(GAMES).toEqual(fixture.GAMES);
  });
});
