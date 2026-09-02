import { describe, expect, it } from 'vitest';

import { RESET_CLEARS, RESET_KEEPS_TEXT, resetProgress } from '@/domain/parent/progressReset';
import { K } from '@/services/storage/keys';
import type { TalkiWord } from '@/domain/types';

import { createInMemoryStorage } from './helpers/inMemoryStorage';

describe('progress reset — data safety', () => {
  it('clears lia:progress, lia:stats and lia:lastcat only', async () => {
    const storage = createInMemoryStorage();
    const custom: TalkiWord = { id: 'cw-keep', word: 'סבתא', emoji: '💜', photo: 'data:image/jpeg;base64,xx' };
    await storage.set(K.progress, ['animals:כֶּלֶב']);
    await storage.set(K.stats, { 'animals:כֶּלֶב': { seen: 3, wrong: 1 } });
    await storage.set(K.lastcat, 'animals');
    await storage.set(K.rec('animals:כֶּלֶב'), { uri: 'data:audio/webm;base64,abc', mime: 'audio/webm' });
    await storage.set(K.customIndex, [custom.id]);
    await storage.set(K.custom(custom.id!), custom);
    await storage.set(K.settings, { rate: 0.85 });

    await resetProgress(storage);

    expect(await storage.get(K.progress)).toBeNull();
    expect(await storage.get(K.stats)).toBeNull();
    expect(await storage.get(K.lastcat)).toBeNull();

    expect(await storage.get(K.rec('animals:כֶּלֶב'))).toEqual({
      uri: 'data:audio/webm;base64,abc',
      mime: 'audio/webm',
    });
    expect(await storage.get(K.customIndex)).toEqual(['cw-keep']);
    expect(await storage.get(K.custom('cw-keep'))).toEqual(custom);
    expect(await storage.get(K.settings)).toEqual({ rate: 0.85 });

    expect(RESET_CLEARS).toEqual([K.progress, K.stats, K.lastcat]);
    expect(RESET_KEEPS_TEXT).toContain('lia:rec:*');
    expect(RESET_KEEPS_TEXT).toContain('lia:custom:*');
  });
});
