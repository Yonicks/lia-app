import { describe, expect, it } from 'vitest';

import {
  customAppearsInMine,
  customCountsInTotal,
  deleteCustomWord,
  loadCustomWords,
  saveCustomWord,
} from '@/domain/parent/customWords';
import { resolveStartCategory } from '@/domain/games/startGame';
import { K } from '@/services/storage/keys';
import { allCats } from '@/domain/vocabulary/allCats';
import type { TalkiWord } from '@/domain/types';

import { createInMemoryStorage } from './helpers/inMemoryStorage';

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wAAA';

describe('custom words', () => {
  it('CRUD round-trips through storage and the index stays consistent after delete', async () => {
    const storage = createInMemoryStorage();
    const a: TalkiWord = { id: 'cw-a', word: 'סבתא', emoji: '👵', photo: PHOTO };
    const b: TalkiWord = { id: 'cw-b', word: 'בובה', emoji: '🧸' };
    await saveCustomWord(storage, a);
    await saveCustomWord(storage, b);
    expect(await loadCustomWords(storage)).toHaveLength(2);
    expect(await storage.get<string[]>(K.customIndex)).toEqual(['cw-a', 'cw-b']);

    const updated = await saveCustomWord(storage, { ...a, word: 'סבתא רותי' });
    expect(updated.find((w) => w.id === 'cw-a')?.word).toBe('סבתא רותי');
    expect(updated.find((w) => w.id === 'cw-a')?.photo).toBe(PHOTO);

    await deleteCustomWord(storage, 'cw-a');
    const left = await loadCustomWords(storage);
    expect(left.map((w) => w.id)).toEqual(['cw-b']);
    expect(await storage.get(K.custom('cw-a'))).toBeNull();
    expect(await storage.get<string[]>(K.customIndex)).toEqual(['cw-b']);
  });

  it('a custom word appears in allCats() under mine and counts in totalWords()', async () => {
    const storage = createInMemoryStorage();
    const word: TalkiWord = { id: 'cw-1', word: 'כלב שכן', emoji: '🐕', photo: PHOTO };
    const custom = await saveCustomWord(storage, word);
    expect(customAppearsInMine(custom)).toBe(true);
    expect(customCountsInTotal(custom)).toBe(true);
    const mine = allCats(custom).find((c) => c.id === 'mine');
    expect(mine?.items[0]?.photo).toBe(PHOTO);
  });

  it('a photo is stored and retrieved intact', async () => {
    const storage = createInMemoryStorage();
    await saveCustomWord(storage, { id: 'cw-p', word: 'תמונה', emoji: '📷', photo: PHOTO });
    const loaded = await storage.get<TalkiWord>(K.custom('cw-p'));
    expect(loaded?.photo).toBe(PHOTO);
  });

  it('a custom word can be used in a game when MIN_ITEMS is satisfied', async () => {
    const storage = createInMemoryStorage();
    const words: TalkiWord[] = [1, 2, 3, 4].map((n) => ({
      id: `cw-${n}`,
      word: `מילה${n}`,
      emoji: '💜',
    }));
    let custom: TalkiWord[] = [];
    for (const w of words) custom = await saveCustomWord(storage, w);
    const cats = allCats(custom);
    const result = resolveStartCategory('quiz', 'mine', cats);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.category.id).toBe('mine');
  });
});
